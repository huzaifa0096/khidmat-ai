/**
 * Real-time speech recognition hook.
 *
 * Web preview: uses Web Speech API (window.SpeechRecognition /
 * webkitSpeechRecognition). Supports Urdu via `ur-PK` and English via `en-US`.
 *
 * Native (Expo Go): real STT needs a custom dev client + native module,
 * which we can't ship inside Expo Go. We return `unsupported`.
 *
 * Permission flow on web:
 *  1. First call to start() proactively triggers getUserMedia({audio:true})
 *     which makes the browser show its mic permission prompt.
 *  2. Once user clicks Allow, recognition.start() actually opens the mic.
 *  3. interim results stream live; final result fires on silence end.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export type SpeechStatus =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'unsupported'
  | 'denied'
  | 'error';

type OnResult = (text: string, isFinal: boolean) => void;

export const useSpeechRecognition = (lang: 'ur' | 'en') => {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef<OnResult | null>(null);
  const stoppedManuallyRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setStatus('unsupported');
      return;
    }
    if (typeof window === 'undefined') return;
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setStatus('unsupported');
      return;
    }
    // Pre-check microphone permission so we can warn the user upfront if it's
    // already in 'denied' state (previously denied, will silently fail on start).
    (async () => {
      try {
        if (navigator.permissions?.query) {
          const p = await navigator.permissions.query({
            name: 'microphone' as PermissionName,
          });
          if (p.state === 'denied') {
            setStatus('denied');
            setErrorMessage(
              'Microphone is blocked for this site. Click the lock icon in the address bar → Permissions → Microphone → Allow, then refresh.'
            );
          }
          p.addEventListener?.('change', () => {
            if (p.state === 'denied') setStatus('denied');
            else if (p.state === 'granted') {
              setStatus('idle');
              setErrorMessage(null);
            }
          });
        }
      } catch {
        // permissions API not available — we'll handle it lazily on start()
      }
    })();
  }, []);

  const ensureMicPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      // Older browsers — let recognition.start() handle it
      return true;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the audio tracks immediately — we just needed permission
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.warn('[SpeechRecognition] getUserMedia denied:', e?.name, e?.message);
      setStatus('denied');
      setErrorMessage(
        e?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Click the lock icon in the address bar and allow microphone.'
          : 'Could not access microphone: ' + (e?.message || e?.name || 'unknown')
      );
      return false;
    }
  }, []);

  const start = useCallback(
    async (onResult?: OnResult): Promise<boolean> => {
      if (Platform.OS !== 'web') return false;
      const SR =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) {
        setStatus('unsupported');
        setErrorMessage('Web Speech API not supported in this browser');
        return false;
      }

      // 1. Proactively ensure mic permission via getUserMedia
      setStatus('requesting_permission');
      setErrorMessage(null);
      const allowed = await ensureMicPermission();
      if (!allowed) return false;

      // 2. Stop any prior recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
        } catch {}
        recognitionRef.current = null;
      }

      onResultRef.current = onResult || null;
      stoppedManuallyRef.current = false;

      const recognition = new SR();
      recognition.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
      // continuous=true keeps mic open until we explicitly call stop() — better UX
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let accumulatedFinal = '';

      recognition.onstart = () => {
        // eslint-disable-next-line no-console
        console.log('[SpeechRecognition] started:', recognition.lang);
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let newFinal = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            newFinal += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        if (newFinal) accumulatedFinal += newFinal + ' ';
        const text = (accumulatedFinal + interim).trim();
        setTranscript(text);
        onResultRef.current?.(text, newFinal.length > 0);
      };

      recognition.onerror = (e: any) => {
        // eslint-disable-next-line no-console
        console.warn('[SpeechRecognition] error event:', e?.error, e);
        const err = e?.error;
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setStatus('denied');
          setErrorMessage(
            'Microphone permission denied. Click the lock icon in the address bar → Site permissions → Microphone → Allow.'
          );
        } else if (err === 'no-speech') {
          setErrorMessage(
            lang === 'ur' ? 'Awaaz nahi aayi — phir bolein' : 'No speech detected — try again'
          );
          // keep status as is so UI can show transient hint
        } else if (err === 'aborted') {
          // user-initiated stop, not a real error
        } else if (err === 'network') {
          setStatus('error');
          setErrorMessage('Network error during speech recognition');
        } else if (err === 'language-not-supported') {
          // fall back to English
          setStatus('error');
          setErrorMessage(`Language ${recognition.lang} not supported by this browser — try English`);
        } else {
          setStatus('error');
          setErrorMessage('Speech recognition error: ' + (err || 'unknown'));
        }
      };

      recognition.onend = () => {
        // eslint-disable-next-line no-console
        console.log('[SpeechRecognition] ended (manualStop=', stoppedManuallyRef.current, ')');
        // If onend fires but user didn't stop manually and we're still in listening state,
        // it means the recognition stopped on its own (silence timeout etc.).
        setStatus((s) => (s === 'listening' || s === 'requesting_permission' ? 'idle' : s));
      };

      recognitionRef.current = recognition;
      setTranscript('');
      try {
        recognition.start();
        return true;
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn('[SpeechRecognition] start() threw:', e);
        setStatus('error');
        setErrorMessage(e?.message || 'Could not start speech recognition');
        return false;
      }
    },
    [lang, ensureMicPermission]
  );

  const stop = useCallback(() => {
    stoppedManuallyRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setStatus((s) => (s === 'listening' || s === 'requesting_permission' ? 'idle' : s));
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  return {
    status,
    transcript,
    errorMessage,
    start,
    stop,
    reset,
    listening: status === 'listening' || status === 'requesting_permission',
    requesting: status === 'requesting_permission',
    supported: status !== 'unsupported',
    denied: status === 'denied',
  };
};
