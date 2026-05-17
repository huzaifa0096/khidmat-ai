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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
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

  useEffect(() => {
    if (!visible) return;
    setLoadingScenarios(true);
    fetchEstimateScenarios()
      .then((d) => setScenarios(d?.scenarios || []))
      .catch(() => {})
      .finally(() => setLoadingScenarios(false));
  }, [visible]);

  const handlePick = async (s: Scenario) => {
    setPickedScenario(s);
    setAnalyzing(true);
    setEstimate(null);
    try {
      // Simulate "AI analyzing image" delay so the UX feels real
      const [res] = await Promise.all([
        estimateFromImage({ scenario_id: s.id, user_id: user.id }),
        new Promise((r) => setTimeout(r, 1400)),
      ]);
      if (res?.error) {
        throw new Error(res.error);
      }
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
            {/* STATE 1: pick a scenario */}
            {!pickedScenario && !analyzing && !estimate ? (
              <>
                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1,
                    marginBottom: 10,
                  }}
                >
                  {lang === 'ur' ? 'COMMON PROBLEMS' : 'COMMON PROBLEMS'}
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

            {/* STATE 2: analyzing */}
            {analyzing ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: 16 }}>
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
                <ActivityIndicator size="large" color={colors.brand.textAccent} />
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 15,
                    fontWeight: '700',
                    textAlign: 'center',
                  }}
                >
                  {lang === 'ur' ? 'AI Vision analyzing...' : 'AI Vision analyzing...'}
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
