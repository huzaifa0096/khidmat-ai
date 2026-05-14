/**
 * Cancel Booking Sheet — bottom modal with reason picker.
 *
 * Used by both customers (booking-confirmed screen) and providers
 * (provider-home confirmed jobs) to cancel with a reason.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Platform, Modal, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { colors as defaultColors, radii, spacing } from '../theme/colors';

type ReasonOption = {
  code: string;
  label_en: string;
  label_ur: string;
  icon: any;
  severity?: 'mild' | 'serious';
};

const CUSTOMER_REASONS: ReasonOption[] = [
  { code: 'changed_mind', label_en: 'Changed my mind', label_ur: 'Khayal badal gaya', icon: 'reload' },
  { code: 'wrong_time', label_en: 'Wrong time selected', label_ur: 'Waqt galat select kiya', icon: 'time' },
  { code: 'found_alternative', label_en: 'Found another option', label_ur: 'Doosra option mil gaya', icon: 'swap-horizontal' },
  { code: 'price_too_high', label_en: 'Price too high', label_ur: 'Price zyada hai', icon: 'cash' },
  { code: 'no_longer_needed', label_en: 'No longer needed', label_ur: 'Ab zaroorat nahi', icon: 'close-circle' },
  { code: 'provider_unresponsive', label_en: 'Provider not responding', label_ur: 'Provider reply nahi karta', icon: 'alert', severity: 'serious' },
  { code: 'other', label_en: 'Other reason', label_ur: 'Koi or wajah', icon: 'ellipsis-horizontal' },
];

const PROVIDER_REASONS: ReasonOption[] = [
  { code: 'unavailable', label_en: "Can't make it", label_ur: 'Nahi aa sakta', icon: 'time' },
  { code: 'out_of_area', label_en: 'Out of service area', label_ur: 'Yeh area mere range mein nahi', icon: 'location' },
  { code: 'sick', label_en: 'Sick / personal emergency', label_ur: 'Tabiyat kharab', icon: 'medical' },
  { code: 'equipment', label_en: 'Equipment issue', label_ur: 'Aalat ka masla', icon: 'construct' },
  { code: 'price_misunderstanding', label_en: 'Pricing disagreement', label_ur: 'Price pe ittefaq nahi', icon: 'cash' },
  { code: 'fully_booked', label_en: 'Fully booked', label_ur: 'Pehle se busy hun', icon: 'calendar' },
  { code: 'other', label_en: 'Other reason', label_ur: 'Koi or wajah', icon: 'ellipsis-horizontal' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason_code: string; reason: string }) => Promise<void> | void;
  byParty: 'customer' | 'provider';
  lang: 'ur' | 'en';
  themeColors?: typeof defaultColors;
};

export const CancelBookingSheet = ({ visible, onClose, onConfirm, byParty, lang, themeColors }: Props) => {
  const colors = themeColors || defaultColors;
  const REASONS = byParty === 'customer' ? CUSTOMER_REASONS : PROVIDER_REASONS;
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [extraText, setExtraText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSelectedCode(null);
    setExtraText('');
    setSubmitting(false);
  };

  const handleConfirm = async () => {
    if (!selectedCode) {
      Alert.alert(
        lang === 'ur' ? 'Wajah Select Karein' : 'Pick a reason',
        lang === 'ur' ? 'Cancellation ki wajah batayein' : 'Please tell us why you are cancelling'
      );
      return;
    }
    const reason = REASONS.find((r) => r.code === selectedCode);
    const reasonLabel = reason ? (lang === 'ur' ? reason.label_ur : reason.label_en) : '';
    const finalReason =
      selectedCode === 'other' || extraText.trim()
        ? `${reasonLabel}${extraText.trim() ? ': ' + extraText.trim() : ''}`
        : reasonLabel;

    setSubmitting(true);
    try {
      await onConfirm({ reason_code: selectedCode, reason: finalReason });
      reset();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not cancel');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%' }}>
          <MotiView
            from={{ translateY: 40, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            style={{
              backgroundColor: colors.bg.surfaceSolid,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: spacing.xl,
              maxHeight: '85%',
              borderTopWidth: 1,
              borderTopColor: colors.border.subtle,
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.text.quaternary,
                marginBottom: spacing.md,
              }}
            />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: colors.semantic.danger + '22',
                  borderWidth: 1,
                  borderColor: colors.semantic.danger + '55',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close-circle" size={22} color={colors.semantic.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 }}>
                  {lang === 'ur' ? 'Booking Cancel Karein' : 'Cancel Booking'}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 1 }}>
                  {byParty === 'customer'
                    ? lang === 'ur'
                      ? 'Wajah batayein — provider ko inform kar denge'
                      : "Tell us why — we'll inform the provider"
                    : lang === 'ur'
                    ? 'Customer ko foran notification jayegi'
                    : 'Customer will be notified instantly'}
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}
              style={{ maxHeight: 380 }}
            >
              {REASONS.map((r) => {
                const selected = selectedCode === r.code;
                return (
                  <Pressable key={r.code} onPress={() => setSelectedCode(r.code)}>
                    {({ pressed }) => (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          borderRadius: radii.md,
                          borderWidth: 1.5,
                          borderColor: selected ? colors.semantic.danger : colors.border.subtle,
                          backgroundColor: selected
                            ? colors.semantic.danger + '12'
                            : pressed
                            ? colors.bg.elevated
                            : 'transparent',
                          marginBottom: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            backgroundColor: selected
                              ? colors.semantic.danger + '22'
                              : colors.bg.elevated,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons
                            name={r.icon}
                            size={15}
                            color={selected ? colors.semantic.danger : colors.text.secondary}
                          />
                        </View>
                        <Text
                          style={{
                            color: colors.text.primary,
                            fontSize: 14,
                            fontWeight: selected ? '700' : '500',
                            flex: 1,
                            letterSpacing: -0.2,
                          }}
                        >
                          {lang === 'ur' ? r.label_ur : r.label_en}
                        </Text>
                        {selected ? (
                          <Ionicons name="checkmark-circle" size={20} color={colors.semantic.danger} />
                        ) : (
                          <View
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              borderWidth: 1.5,
                              borderColor: colors.border.default,
                            }}
                          />
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}

              {/* Optional extra explanation */}
              {selectedCode ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text
                    style={{
                      color: colors.text.tertiary,
                      fontSize: 11,
                      fontWeight: '800',
                      letterSpacing: 1.2,
                      marginBottom: 6,
                    }}
                  >
                    {lang === 'ur' ? 'AUR DETAIL (OPTIONAL)' : 'ADDITIONAL DETAIL (OPTIONAL)'}
                  </Text>
                  <TextInput
                    value={extraText}
                    onChangeText={setExtraText}
                    placeholder={
                      lang === 'ur'
                        ? 'Aur kuch batana chahein...'
                        : 'Anything else we should know...'
                    }
                    placeholderTextColor={colors.text.placeholder}
                    multiline
                    style={{
                      backgroundColor: colors.bg.elevated,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.border.subtle,
                      color: colors.text.primary,
                      fontSize: 13,
                      padding: 12,
                      minHeight: 60,
                      textAlignVertical: 'top',
                      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
                    }}
                    maxLength={200}
                  />
                </View>
              ) : null}
            </ScrollView>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.lg }}>
              <Pressable
                onPress={() => {
                  reset();
                  onClose();
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: radii.pill,
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.border.default,
                  alignItems: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '700' }}>
                  {lang === 'ur' ? 'Wapis' : 'Keep Booking'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={submitting || !selectedCode}
                style={({ pressed }) => ({ flex: 2, opacity: !selectedCode ? 0.4 : pressed ? 0.85 : 1 })}
              >
                <LinearGradient
                  colors={['#FF453A', '#FF9F0A'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 14,
                    borderRadius: radii.pill,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="trash" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: -0.2 }}>
                    {submitting
                      ? lang === 'ur'
                        ? 'Cancel kar rahe hain...'
                        : 'Cancelling...'
                      : lang === 'ur'
                      ? 'Cancel Confirm'
                      : 'Confirm Cancel'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </MotiView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
