/**
 * ProviderCounterSheet — provider taps "Counter" on a pending job; this modal
 * opens letting them input a new price + optional note. Sent to backend which
 * flips booking status to `pending_customer_counter_response` so the customer's
 * booking-confirmed screen surfaces the counter for accept-or-counter-back.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../state/AppContext';
import { radii, spacing } from '../theme/colors';
import { providerCounterOffer } from '../services/api';

type Props = {
  visible: boolean;
  onClose: () => void;
  jobId: string;
  customerOfferedPkr: number;
  onCounterSent?: () => void;
};

export const ProviderCounterSheet = ({
  visible,
  onClose,
  jobId,
  customerOfferedPkr,
  onCounterSent,
}: Props) => {
  const { colors, lang } = useApp();
  const [counter, setCounter] = useState('');
  const [sending, setSending] = useState(false);

  // Suggested counter-offers (10%, 20%, 30% above customer's offer)
  const suggestions = [
    { label: '+10%', value: Math.round(customerOfferedPkr * 1.1) },
    { label: '+20%', value: Math.round(customerOfferedPkr * 1.2) },
    { label: '+30%', value: Math.round(customerOfferedPkr * 1.3) },
  ];

  const submit = async (price: number) => {
    if (!price || price <= 0) {
      Alert.alert(
        lang === 'ur' ? 'Galat price' : 'Invalid price',
        lang === 'ur' ? 'Sahi number type karein' : 'Enter a valid number'
      );
      return;
    }
    if (price <= customerOfferedPkr) {
      Alert.alert(
        lang === 'ur' ? 'Galat counter' : 'Invalid counter',
        lang === 'ur'
          ? `Counter customer ki offer (PKR ${customerOfferedPkr.toLocaleString()}) se zyada hona chahiye`
          : `Counter must be higher than customer's offer of PKR ${customerOfferedPkr.toLocaleString()}`
      );
      return;
    }
    setSending(true);
    try {
      await providerCounterOffer(jobId, { counter_price_pkr: price });
      Alert.alert(
        lang === 'ur' ? 'Counter bhej diya ✓' : 'Counter sent ✓',
        lang === 'ur'
          ? `PKR ${price.toLocaleString()} ka counter customer ko bhej diya hai`
          : `Counter-offer of PKR ${price.toLocaleString()} sent to customer`
      );
      onCounterSent?.();
      onClose();
      setCounter('');
    } catch (e: any) {
      Alert.alert(
        lang === 'ur' ? 'Bhejne mein issue' : 'Failed to send',
        e?.response?.data?.detail || e?.message || 'Try again'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = () => {
    const price = parseInt(counter.replace(/[^\d]/g, ''), 10);
    submit(price);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View
            style={{
              backgroundColor: colors.bg.primary,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              padding: spacing.lg,
              paddingBottom: 28,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
                <Ionicons name="swap-horizontal" size={20} color={colors.brand.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '800' }}>
                  {lang === 'ur' ? 'Counter Offer Bhejein' : 'Send Counter-Offer'}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                  {lang === 'ur'
                    ? `Customer ne PKR ${customerOfferedPkr.toLocaleString()} offer ki hai`
                    : `Customer offered PKR ${customerOfferedPkr.toLocaleString()}`}
                </Text>
              </View>
              <Pressable onPress={onClose}>
                <Ionicons name="close-circle" size={26} color={colors.text.tertiary} />
              </Pressable>
            </View>

            <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
              {lang === 'ur' ? 'QUICK COUNTERS' : 'QUICK COUNTERS'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {suggestions.map((s) => (
                <Pressable
                  key={s.value}
                  onPress={() => submit(s.value)}
                  disabled={sending}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: radii.md,
                    backgroundColor: colors.brand.primary + '18',
                    borderWidth: 1,
                    borderColor: colors.brand.primary + '40',
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: colors.brand.textAccent, fontSize: 10, fontWeight: '700' }}>
                    {s.label}
                  </Text>
                  <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '800', marginTop: 2 }}>
                    PKR {s.value.toLocaleString()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
              {lang === 'ur' ? 'YA CUSTOM PRICE' : 'OR CUSTOM PRICE'}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.bg.elevated,
                  borderRadius: radii.pill,
                  paddingHorizontal: 14,
                }}
              >
                <Text style={{ color: colors.text.tertiary, fontSize: 14, marginRight: 6 }}>PKR</Text>
                <TextInput
                  value={counter}
                  onChangeText={setCounter}
                  placeholder={`${Math.round(customerOfferedPkr * 1.2)}`}
                  placeholderTextColor={colors.text.placeholder}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    color: colors.text.primary,
                    paddingVertical: 12,
                    fontSize: 15,
                    fontWeight: '700',
                  }}
                  onSubmitEditing={handleSubmit}
                />
              </View>
              <Pressable
                onPress={handleSubmit}
                disabled={sending || !counter.trim()}
                style={({ pressed }) => ({
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: counter.trim() ? colors.brand.primary : colors.bg.elevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color={counter.trim() ? '#fff' : colors.text.tertiary} />
                )}
              </Pressable>
            </View>

            <Text style={{ color: colors.text.tertiary, fontSize: 11, lineHeight: 16 }}>
              {lang === 'ur'
                ? 'Customer ko aap ka counter dikhe ga. Wo accept karein ya phir counter karein.'
                : 'Customer sees your counter and can accept or counter-back.'}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
