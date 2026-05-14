/**
 * Google Sign-In button — uses Google Identity Services on web.
 *
 * Behavior:
 *  - If EXPO_PUBLIC_GOOGLE_CLIENT_ID is set, renders the real GIS button and
 *    returns the decoded JWT payload to onSuccess.
 *  - Otherwise, falls back to a styled button that simulates a Google account
 *    sign-in (returns a mock profile). This keeps the demo flow working without
 *    OAuth setup.
 */
import React, { useEffect, useRef } from 'react';
import { Pressable, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii } from '../theme/colors';

declare global {
  interface Window {
    google?: any;
    __KHIDMAT_GSI_LOADING__?: Promise<void>;
  }
}

const CLIENT_ID =
  (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_GOOGLE_CLIENT_ID) || '';

const loadGsi = () => {
  if (typeof document === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (window.__KHIDMAT_GSI_LOADING__) return window.__KHIDMAT_GSI_LOADING__;
  const p = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('GSI failed to load'));
    document.head.appendChild(s);
  });
  window.__KHIDMAT_GSI_LOADING__ = p;
  return p;
};

const decodeJwt = (token: string): any => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const MOCK_GOOGLE_USERS = [
  { name: 'Huzaifa Naeem', email: 'huzaifanaeem.work@gmail.com', picture: 'https://i.pravatar.cc/300?u=hzfa' },
  { name: 'Sara Ahmed', email: 'sara.ahmed@gmail.com', picture: 'https://i.pravatar.cc/300?u=sara' },
  { name: 'Bilal Khan', email: 'bilal.khan@gmail.com', picture: 'https://i.pravatar.cc/300?u=bilal' },
];

type Props = {
  onSuccess: (profile: { name: string; email: string; picture?: string }) => void;
  label?: string;
};

export const GoogleSignInButton = ({ onSuccess, label = 'Continue with Google' }: Props) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !CLIENT_ID) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !buttonRef.current || renderedRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response: any) => {
            const payload = decodeJwt(response.credential);
            if (payload) {
              onSuccess({
                name: payload.name || 'Google User',
                email: payload.email || '',
                picture: payload.picture,
              });
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          width: 320,
          text: 'continue_with',
          logo_alignment: 'left',
        });
        renderedRef.current = true;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [onSuccess]);

  // Real GIS button (when CLIENT_ID is configured)
  if (Platform.OS === 'web' && CLIENT_ID) {
    return (
      <View style={{ alignItems: 'center' }}>
        {/* @ts-ignore — DOM ref on web */}
        <div ref={(el: any) => (buttonRef.current = el)} />
      </View>
    );
  }

  // Demo mode — styled button that simulates Google sign-in
  const handleDemoSignIn = () => {
    const profile = MOCK_GOOGLE_USERS[Math.floor(Math.random() * MOCK_GOOGLE_USERS.length)];
    onSuccess(profile);
  };

  return (
    <Pressable onPress={handleDemoSignIn}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingVertical: 13,
            paddingHorizontal: 22,
            borderRadius: radii.pill,
            backgroundColor: '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 3,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <GoogleGlyph />
          <Text
            style={{
              color: '#1f1f1f',
              fontSize: 15,
              fontWeight: '600',
              letterSpacing: -0.2,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const GoogleGlyph = () => (
  <View
    style={{
      width: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {/* Compose using overlapping coloured circles — simulates Google "G" multi-colour mark */}
    <View
      style={{
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2.6,
        borderTopColor: '#4285F4',
        borderRightColor: '#34A853',
        borderBottomColor: '#FBBC05',
        borderLeftColor: '#EA4335',
      }}
    />
    <Text style={{ color: '#4285F4', fontSize: 11, fontWeight: '900' }}>G</Text>
  </View>
);
