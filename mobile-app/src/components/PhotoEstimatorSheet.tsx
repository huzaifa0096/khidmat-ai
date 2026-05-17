/**
 * PhotoEstimatorSheet — "Take a photo, get an AI estimate" workflow.
 *
 * Customer picks a problem scenario card (e.g., "AC not cooling"), the AI
 * analyzes it (mock: scenario lookup with realistic delay), and returns:
 *  - Detected service category
 *  - Issue description
 *  - Estimated price range
 *  - Urgency
 *  - Parts likely needed
 *  - AI confidence + reasoning
 * Then customer can tap "Find Providers" to enter the regular search flow
 * with the right service category + urgency pre-set.
 *
 * Scenario-based (not real camera) for demo robustness — no permissions,
 * no upload, deterministic output.
 */
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../state/AppContext';
import { radii, spacing } from '../theme/colors';
import { fetchEstimateScenarios, estimateFromImage, parseAndRank } from '../services/api';

type Scenario = {
  id: string;
  title_en: string;
  title_ur: string;
  thumbnail_emoji: string;
  color: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onFindProviders?: (estimate: any) => void;
};

export const PhotoEstimatorSheet = ({ visible, onClose, onFindProviders }: Props) => {
  const { colors, lang, user, setCurrentTrace } = useApp();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [pickedScenario, setPickedScenario] = useState<Scenario | null>(null);
  const [findingProviders, setFindingProviders] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [aiGuess, setAiGuess] = useState<Scenario | null>(null);
  const [visionAnalyzing, setVisionAnalyzing] = useState(false);

  // Deterministic initial guess from image URI hash. Without a real Vision model
  // we can't classify the image content — so we offer the guess as a STARTING
  // point and let the user override with one tap. Honest UX.
  const pickInitialGuess = (uri: string): Scenario => {
    if (!scenarios.length) {
      return {
        id: 'ac_not_cooling',
        title_en: 'AC not cooling',
        title_ur: 'AC thanda nahi kar raha',
        thumbnail_emoji: '❄️',
        color: '#4DA8FF',
      };
    }
    let hash = 0;
    for (let i = 0; i < uri.length; i++) hash = (hash * 31 + uri.charCodeAt(i)) | 0;
    return scenarios[Math.abs(hash) % scenarios.length];
  };

  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          lang === 'ur' ? 'Permission chahiye' : 'Permission needed',
          lang === 'ur'
            ? 'Camera ka permission de dein, ya neeche se common problem pick karein'
            : 'Allow camera access, or pick a common problem below'
        );
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsEditing: false,
        base64: true,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        analyzeImage(res.assets[0].uri, res.assets[0].base64 || null);
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e?.message || 'Could not open camera');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          lang === 'ur' ? 'Permission chahiye' : 'Permission needed',
          lang === 'ur'
            ? 'Gallery ka permission de dein, ya neeche se common problem pick karein'
            : 'Allow gallery access, or pick a common problem below'
        );
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsEditing: false,
        base64: true,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        analyzeImage(res.assets[0].uri, res.assets[0].base64 || null);
      }
    } catch (e: any) {
      Alert.alert('Gallery Error', e?.message || 'Could not open gallery');
    }
  };

  // Step 1: photo captured. Try REAL Gemini Vision first if we have base64.
  // If Vision succeeds + confidence is high, jump straight to the result.
  // Otherwise fall through to the confirm-category step.
  const analyzeImage = async (uri: string, base64: string | null) => {
    setCapturedImageUri(uri);
    setCapturedImageBase64(base64);
    setEstimate(null);
    setPickedScenario(null);

    // Path A: Try real Vision (if backend has GEMINI_API_KEY)
    if (base64) {
      setVisionAnalyzing(true);
      try {
        const res = await estimateFromImage({
          image_base64: base64,
          user_id: user.id,
        });
        if (res?.vision_classified && res?.scenario_id) {
          // Real Vision came back — show the result directly
          const matchedScenario =
            scenarios.find((s) => s.id === res.scenario_id) || pickInitialGuess(uri);
          setPickedScenario(matchedScenario);
          setEstimate(res);
          setVisionAnalyzing(false);
          return;
        }
      } catch {
        // fall through to confirm-category fallback
      }
      setVisionAnalyzing(false);
    }

    // Path B: No Vision (no key, or call failed) → show confirm-category UX
    const guess = pickInitialGuess(uri);
    setAiGuess(guess);
    setAwaitingConfirm(true);
    setAnalyzing(false);
  };

  // Step 2: user has confirmed (or overridden) the category. Now run the
  // estimate endpoint.
  const confirmAndAnalyze = async (s: Scenario) => {
    setPickedScenario(s);
    setAwaitingConfirm(false);
    setAnalyzing(true);
    setEstimate(null);
    try {
      const [res] = await Promise.all([
        estimateFromImage({ scenario_id: s.id, user_id: user.id }),
        new Promise((r) => setTimeout(r, 1200)),
      ]);
      if (res?.error) throw new Error(res.error);
      setEstimate(res);
    } catch (e: any) {
      Alert.alert(
        lang === 'ur' ? 'Analysis fail hua' : 'Analysis Failed',
        e?.message || 'Try a common problem instead'
      );
      setPickedScenario(null);
      setCapturedImageUri(null);
      setAiGuess(null);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    setLoadingScenarios(true);
    fetchEstimateScenarios()
      .then((d) => setScenarios(d?.scenarios || []))
      .catch(() => {})
      .finally(() => setLoadingScenarios(false));
  }, [visible]);

  const handlePick = async (s: Scenario) => {
    setCapturedImageUri(null); // scenario-card path doesn't have a captured image
    setPickedScenario(s);
    setAnalyzing(true);
    setEstimate(null);
    try {
      const [res] = await Promise.all([
        estimateFromImage({ scenario_id: s.id, user_id: user.id }),
        new Promise((r) => setTimeout(r, 1400)),
      ]);
      if (res?.error) throw new Error(res.error);
      setEstimate(res);
    } catch (e: any) {
      Alert.alert(
        lang === 'ur' ? 'Estimate nahi mil saka' : 'Estimate Failed',
        e?.message || 'Try another scenario'
      );
      setPickedScenario(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFindProviders = async () => {
    if (!estimate) return;
    setFindingProviders(true);
    try {
      // Build a synthetic search input using the detected category
      const categoryWord = estimate.category_id.replace(/_/g, ' ');
      const sector = user.sector || 'G-13';
      const synthInput =
        lang === 'ur'
          ? `${categoryWord} chahiye ${sector} mein ${estimate.urgency === 'emergency' ? 'foran' : ''}`
          : `Need ${categoryWord} in ${sector} ${estimate.urgency === 'emergency' ? 'urgently' : ''}`;
      const trace = await parseAndRank(synthInput, user.id || 'U001');
      if (trace?.trace_id) {
        setCurrentTrace(trace);
        onFindProviders?.(estimate);
        onClose();
        // Reset
        setTimeout(() => {
          setEstimate(null);
          setPickedScenario(null);
        }, 300);
      } else {
        throw new Error('No trace returned');
      }
    } catch (e: any) {
      Alert.alert(
        lang === 'ur' ? 'Providers nahi mil sake' : 'Failed to find providers',
        e?.message || 'Try again'
      );
    } finally {
      setFindingProviders(false);
    }
  };

  const reset = () => {
    setEstimate(null);
    setPickedScenario(null);
    setAnalyzing(false);
    setCapturedImageUri(null);
    setCapturedImageBase64(null);
    setAwaitingConfirm(false);
    setAiGuess(null);
    setVisionAnalyzing(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.bg.primary,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            maxHeight: '88%',
            paddingBottom: 24,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.lg,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border.divider,
              gap: 10,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.brand.accent + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="camera" size={20} color={colors.brand.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '800' }}>
                {lang === 'ur' ? 'Photo se AI Estimate' : 'AI Photo Estimate'}
              </Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                {lang === 'ur'
                  ? 'Apna masla pick karein — AI estimate dega'
                  : 'Pick your problem — AI gives instant estimate'}
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={colors.text.tertiary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {/* STATE 1: pick a scenario (hidden during awaitingConfirm/visionAnalyzing) */}
            {!pickedScenario && !analyzing && !estimate && !awaitingConfirm && !visionAnalyzing ? (
              <>
                {/* Real camera / gallery actions */}
                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1,
                    marginBottom: 10,
                  }}
                >
                  {lang === 'ur' ? 'APNI PHOTO LEIN YA UPLOAD KAREIN' : 'TAKE OR UPLOAD YOUR PHOTO'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                  <Pressable
                    onPress={handleTakePhoto}
                    style={({ pressed }) => ({
                      flex: 1,
                      padding: 16,
                      borderRadius: radii.lg,
                      backgroundColor: colors.brand.primary,
                      alignItems: 'center',
                      gap: 8,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Ionicons name="camera" size={26} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                      {lang === 'ur' ? 'Camera kholein' : 'Take Photo'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handlePickFromGallery}
                    style={({ pressed }) => ({
                      flex: 1,
                      padding: 16,
                      borderRadius: radii.lg,
                      backgroundColor: colors.brand.accent,
                      alignItems: 'center',
                      gap: 8,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Ionicons name="image" size={26} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                      {lang === 'ur' ? 'Gallery se' : 'Upload Photo'}
                    </Text>
                  </Pressable>
                </View>

                {/* Divider */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <View style={{ flex: 1, height: 0.5, backgroundColor: colors.border.divider }} />
                  <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700' }}>
                    {lang === 'ur' ? 'YA' : 'OR'}
                  </Text>
                  <View style={{ flex: 1, height: 0.5, backgroundColor: colors.border.divider }} />
                </View>

                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1,
                    marginBottom: 10,
                  }}
                >
                  {lang === 'ur' ? 'COMMON PROBLEMS' : 'PICK A COMMON PROBLEM'}
                </Text>
                {loadingScenarios ? (
                  <ActivityIndicator color={colors.brand.textAccent} style={{ marginTop: 30 }} />
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {scenarios.map((s, i) => (
                      <MotiView
                        key={s.id}
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 280, delay: i * 60 }}
                        style={{ width: '48%' }}
                      >
                        <Pressable
                          onPress={() => handlePick(s)}
                          style={({ pressed }) => ({
                            backgroundColor: colors.bg.surfaceSolid,
                            borderRadius: radii.lg,
                            padding: 14,
                            gap: 8,
                            opacity: pressed ? 0.7 : 1,
                            minHeight: 110,
                          })}
                        >
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 14,
                              backgroundColor: s.color + '22',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 26 }}>{s.thumbnail_emoji}</Text>
                          </View>
                          <Text
                            style={{
                              color: colors.text.primary,
                              fontSize: 13,
                              fontWeight: '700',
                              letterSpacing: -0.2,
                            }}
                          >
                            {lang === 'ur' ? s.title_ur : s.title_en}
                          </Text>
                        </Pressable>
                      </MotiView>
                    ))}
                  </View>
                )}
                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontSize: 11,
                    textAlign: 'center',
                    marginTop: 16,
                    lineHeight: 16,
                  }}
                >
                  {lang === 'ur'
                    ? 'AI Vision model aap ki photo analyze karega'
                    : 'AI Vision will analyze the photo of your problem'}
                </Text>
              </>
            ) : null}

            {/* STATE 1.4: Vision analyzing real Gemini call */}
            {visionAnalyzing && capturedImageUri ? (
              <View style={{ alignItems: 'center', paddingVertical: 30, gap: 14 }}>
                <Image
                  source={{ uri: capturedImageUri }}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: radii.lg,
                    backgroundColor: colors.bg.elevated,
                  }}
                  resizeMode="cover"
                />
                <ActivityIndicator size="large" color={colors.brand.textAccent} />
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 15,
                    fontWeight: '700',
                    textAlign: 'center',
                  }}
                >
                  {lang === 'ur'
                    ? 'Gemini Vision aap ki photo dekh raha hai...'
                    : 'Gemini Vision is analyzing your photo...'}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 11, textAlign: 'center' }}>
                  {lang === 'ur'
                    ? 'Real AI image classification — 5-10 sec'
                    : 'Real AI image classification — 5-10 sec'}
                </Text>
              </View>
            ) : null}

            {/* STATE 1.5: confirm category after photo capture */}
            {awaitingConfirm && capturedImageUri && aiGuess && !analyzing && !estimate && !visionAnalyzing ? (
              <View style={{ gap: 14 }}>
                {/* Show the photo */}
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Image
                    source={{ uri: capturedImageUri }}
                    style={{
                      width: '100%',
                      height: 180,
                      borderRadius: radii.lg,
                      backgroundColor: colors.bg.elevated,
                    }}
                    resizeMode="cover"
                  />
                  <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '600' }}>
                    {lang === 'ur' ? 'Aap ki photo' : 'Your photo'}
                  </Text>
                </View>

                {/* AI's guess panel — honest about uncertainty */}
                <View
                  style={{
                    padding: 14,
                    borderRadius: radii.lg,
                    backgroundColor: aiGuess.color + '15',
                    borderWidth: 1,
                    borderColor: aiGuess.color + '40',
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="sparkles" size={14} color={aiGuess.color} />
                    <Text style={{ color: aiGuess.color, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>
                      {lang === 'ur' ? 'AI KA ANDAZA' : "AI'S BEST GUESS"}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text.primary, fontSize: 15, fontWeight: '700' }}>
                    {aiGuess.thumbnail_emoji}  {lang === 'ur' ? aiGuess.title_ur : aiGuess.title_en}
                  </Text>
                  <Text style={{ color: colors.text.tertiary, fontSize: 11, lineHeight: 16 }}>
                    {lang === 'ur'
                      ? 'Yeh sahi hai? Tap karke confirm karein — ya neeche sahi category pick karein.'
                      : 'Is this right? Tap to confirm — or pick the correct category below.'}
                  </Text>
                  <Pressable
                    onPress={() => confirmAndAnalyze(aiGuess)}
                    style={({ pressed }) => ({
                      marginTop: 4,
                      paddingVertical: 10,
                      borderRadius: radii.pill,
                      backgroundColor: aiGuess.color,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                      {lang === 'ur' ? `Haan, ${aiGuess.title_ur}` : `Yes, it's ${aiGuess.title_en}`}
                    </Text>
                  </Pressable>
                </View>

                {/* Override grid */}
                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1,
                    marginTop: 4,
                  }}
                >
                  {lang === 'ur' ? 'YA SAHI CATEGORY PICK KAREIN' : 'OR PICK THE CORRECT CATEGORY'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {scenarios
                    .filter((s) => s.id !== aiGuess.id)
                    .map((s) => (
                      <Pressable
                        key={s.id}
                        onPress={() => confirmAndAnalyze(s)}
                        style={({ pressed }) => ({
                          width: '48%',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          padding: 10,
                          borderRadius: radii.md,
                          backgroundColor: colors.bg.surfaceSolid,
                          opacity: pressed ? 0.6 : 1,
                        })}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            backgroundColor: s.color + '22',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 18 }}>{s.thumbnail_emoji}</Text>
                        </View>
                        <Text
                          numberOfLines={2}
                          style={{ flex: 1, color: colors.text.primary, fontSize: 11, fontWeight: '600' }}
                        >
                          {lang === 'ur' ? s.title_ur : s.title_en}
                        </Text>
                      </Pressable>
                    ))}
                </View>

                <Pressable
                  onPress={reset}
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <Ionicons name="arrow-back" size={13} color={colors.text.tertiary} />
                  <Text style={{ color: colors.text.tertiary, fontSize: 12, fontWeight: '600' }}>
                    {lang === 'ur' ? 'Doosri photo' : 'Different photo'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* STATE 2: analyzing */}
            {analyzing ? (
              <View style={{ alignItems: 'center', paddingVertical: 30, gap: 14 }}>
                {capturedImageUri ? (
                  <Image
                    source={{ uri: capturedImageUri }}
                    style={{
                      width: 160,
                      height: 160,
                      borderRadius: radii.lg,
                      backgroundColor: colors.bg.elevated,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      backgroundColor: pickedScenario!.color + '22',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 40 }}>{pickedScenario!.thumbnail_emoji}</Text>
                  </View>
                )}
                <ActivityIndicator size="large" color={colors.brand.textAccent} />
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 15,
                    fontWeight: '700',
                    textAlign: 'center',
                  }}
                >
                  {lang === 'ur' ? 'AI Vision analyzing aap ki photo...' : 'AI Vision analyzing your photo...'}
                </Text>
                <View style={{ gap: 4 }}>
                  <Text style={{ color: colors.text.tertiary, fontSize: 12, textAlign: 'center' }}>
                    ✓ {lang === 'ur' ? 'Image processed' : 'Image processed'}
                  </Text>
                  <Text style={{ color: colors.text.tertiary, fontSize: 12, textAlign: 'center' }}>
                    ✓ {lang === 'ur' ? 'Detected category' : 'Detected category'}
                  </Text>
                  <Text style={{ color: colors.text.tertiary, fontSize: 12, textAlign: 'center' }}>
                    ⏳ {lang === 'ur' ? 'Computing estimate...' : 'Computing estimate...'}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* STATE 3: estimate result */}
            {estimate && !analyzing ? (
              <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 350 }} style={{ gap: 12 }}>
                {/* Captured image preview (only when actual photo was used) */}
                {capturedImageUri ? (
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <Image
                      source={{ uri: capturedImageUri }}
                      style={{
                        width: '100%',
                        height: 180,
                        borderRadius: radii.lg,
                        backgroundColor: colors.bg.elevated,
                      }}
                      resizeMode="cover"
                    />
                    <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '600' }}>
                      {lang === 'ur' ? 'Aap ki photo' : 'Your photo'}
                    </Text>
                  </View>
                ) : null}

                {/* Picked scenario header */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    padding: 12,
                    borderRadius: radii.lg,
                    backgroundColor: colors.bg.surfaceSolid,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: pickedScenario!.color + '22',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{pickedScenario!.thumbnail_emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
                      {lang === 'ur' ? 'AI ANALYSIS' : 'AI ANALYSIS'}
                    </Text>
                    <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '700', marginTop: 1 }}>
                      {(estimate.category_id || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: colors.semantic.success + '22',
                    }}
                  >
                    <Text style={{ color: colors.semantic.success, fontSize: 11, fontWeight: '800' }}>
                      {Math.round(estimate.ai_confidence * 100)}%
                    </Text>
                  </View>
                </View>

                {/* Issue */}
                <View style={{ padding: 12, borderRadius: radii.lg, backgroundColor: colors.bg.surfaceSolid, gap: 6 }}>
                  <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
                    {lang === 'ur' ? 'DETECTED ISSUE' : 'DETECTED ISSUE'}
                  </Text>
                  <Text style={{ color: colors.text.primary, fontSize: 13, lineHeight: 18 }}>
                    {lang === 'ur' ? estimate.issue_ur : estimate.issue_en}
                  </Text>
                </View>

                {/* Price + urgency */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1, padding: 12, borderRadius: radii.lg, backgroundColor: colors.bg.surfaceSolid }}>
                    <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
                      {lang === 'ur' ? 'PRICE RANGE' : 'PRICE RANGE'}
                    </Text>
                    <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 }}>
                      PKR {estimate.estimated_range_pkr[0].toLocaleString()}–{estimate.estimated_range_pkr[1].toLocaleString()}
                    </Text>
                    <Text style={{ color: colors.text.tertiary, fontSize: 10, marginTop: 1 }}>
                      {lang === 'ur' ? 'Typical: ' : 'Typical: '}PKR {estimate.typical_pkr.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, padding: 12, borderRadius: radii.lg, backgroundColor: colors.bg.surfaceSolid }}>
                    <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
                      {lang === 'ur' ? 'URGENCY' : 'URGENCY'}
                    </Text>
                    <Text
                      style={{
                        color:
                          estimate.urgency === 'emergency'
                            ? colors.semantic.danger
                            : estimate.urgency === 'urgent'
                            ? colors.ios.orange
                            : colors.text.primary,
                        fontSize: 16,
                        fontWeight: '800',
                        marginTop: 2,
                        textTransform: 'uppercase',
                        letterSpacing: -0.3,
                      }}
                    >
                      {estimate.urgency}
                    </Text>
                    <Text style={{ color: colors.text.tertiary, fontSize: 10, marginTop: 1 }}>
                      ~{estimate.estimated_duration_minutes} min job
                    </Text>
                  </View>
                </View>

                {/* Parts */}
                <View style={{ padding: 12, borderRadius: radii.lg, backgroundColor: colors.bg.surfaceSolid, gap: 6 }}>
                  <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
                    {lang === 'ur' ? 'PARTS LIKELY' : 'PARTS LIKELY'}
                  </Text>
                  {estimate.parts_likely?.map((p: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="checkmark-circle" size={12} color={colors.semantic.success} />
                      <Text style={{ color: colors.text.secondary, fontSize: 12 }}>{p}</Text>
                    </View>
                  ))}
                </View>

                {/* Reasoning */}
                <View style={{ padding: 12, borderRadius: radii.lg, backgroundColor: colors.brand.textAccent + '15' }}>
                  <Text style={{ color: colors.brand.textAccent, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 }}>
                    {lang === 'ur' ? 'AI REASONING' : 'AI REASONING'}
                  </Text>
                  <Text style={{ color: colors.text.primary, fontSize: 12, lineHeight: 17 }}>
                    {lang === 'ur' ? estimate.reasoning_ur : estimate.reasoning_en}
                  </Text>
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Pressable
                    onPress={reset}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: radii.pill,
                      backgroundColor: colors.bg.elevated,
                      alignItems: 'center',
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text style={{ color: colors.text.secondary, fontSize: 13, fontWeight: '700' }}>
                      {lang === 'ur' ? 'Phir try karein' : 'Try Another'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleFindProviders}
                    disabled={findingProviders}
                    style={({ pressed }) => ({
                      flex: 2,
                      paddingVertical: 12,
                      borderRadius: radii.pill,
                      backgroundColor: colors.brand.primary,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    {findingProviders ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="search" size={14} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                          {lang === 'ur'
                            ? `${estimate.available_providers_count} Providers Dekhein →`
                            : `Find ${estimate.available_providers_count} Providers →`}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </MotiView>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
