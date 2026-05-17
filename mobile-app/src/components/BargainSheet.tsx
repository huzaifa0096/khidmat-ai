/**
 * BargainSheet — Pakistani-style price negotiation modal.
 *
 * The user types their counter-offer, the Bargain Agent (Antigravity Agent 7)
 * responds with ACCEPT, COUNTER, or REJECT — bilingual reasoning included.
 * Each round is rendered as a chat-like bubble exchange.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useApp } from '../state/AppContext';
import { radii, spacing } from '../theme/colors';
import { bargainNegotiate } from '../services/api';

type Round = {
  round: number;
  customer_offered: number;
  decision: 'accept' | 'counter' | 'reject';
  agreed_price_pkr: number | null;
  reasoning_en: string;
  reasoning_ur: string;
  provider_message_ur: string;
  next_step: string;
  context: any;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  initialPricePkr: number;
  onAgreed?: (finalPrice: number) => void;
};

export const BargainSheet = ({
  visible,
  onClose,
  providerId,
  providerName,
  initialPricePkr,
  onAgreed,
}: Props) => {
  const { colors, lang } = useApp();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [offerText, setOfferText] = useState('');
  const [loading, setLoading] = useState(false);
  const [finalDeal, setFinalDeal] = useState<number | null>(null);

  const currentQuote =
    rounds.length === 0
      ? initialPricePkr
      : rounds[rounds.length - 1].decision === 'counter'
      ? rounds[rounds.length - 1].agreed_price_pkr || initialPricePkr
      : initialPricePkr;

  const canBargain = !finalDeal && rounds.length < 4;

  const submitOffer = async (rawOffer: number) => {
    if (!rawOffer || rawOffer <= 0) {
      Alert.alert(
        lang === 'ur' ? 'Galat offer' : 'Invalid offer',
        lang === 'ur' ? 'Sahi number type karein' : 'Enter a valid number'
      );
      return;
    }
    // Defensive: if providerId is empty (deep-link with no trace), fall back to demo provider
    const safeProviderId = providerId && providerId.trim() ? providerId : 'P1001';
    const safeProposedPrice = currentQuote && currentQuote > 0 ? Math.round(currentQuote) : 3500;

    setLoading(true);
    try {
      const res = await bargainNegotiate({
        provider_id: safeProviderId,
        customer_offer_pkr: Math.round(rawOffer),
        proposed_price_pkr: safeProposedPrice,
        round_number: rounds.length + 1,
      });
      if (!res || res.error || !res.decision) {
        const detail = res?.detail
          ? typeof res.detail === 'string'
            ? res.detail
            : JSON.stringify(res.detail)
          : '';
        throw new Error(res?.error || detail || 'No decision returned from server');
      }
      const newRound: Round = { ...res, customer_offered: rawOffer };
      setRounds((prev) => [...prev, newRound]);
      setOfferText('');

      if (res.decision === 'accept') {
        setFinalDeal(res.agreed_price_pkr);
      }
    } catch (e: any) {
      const apiErrorDetail = e?.response?.data?.detail;
      const apiMsg = apiErrorDetail
        ? typeof apiErrorDetail === 'string'
          ? apiErrorDetail
          : JSON.stringify(apiErrorDetail).slice(0, 200)
        : null;
      console.log('[Bargain] error', e?.message, apiErrorDetail);
      Alert.alert(
        lang === 'ur' ? 'Bargain nahi hua' : 'Bargain Failed',
        apiMsg || e?.message || 'Network error — check backend is running'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOffer = () => {
    const offer = parseInt(offerText.replace(/,/g, '').replace(/\D/g, ''), 10);
    submitOffer(offer);
  };

  // Quick-demo: 1 tap → typical 2-round bargain sequence
  const handleQuickDemo = async () => {
    const demoOffer = Math.round(initialPricePkr * 0.55); // 55% of original = likely counter
    await submitOffer(demoOffer);
  };

  const handleAcceptCounter = () => {
    const last = rounds[rounds.length - 1];
    if (last?.decision === 'counter' && last.agreed_price_pkr) {
      setFinalDeal(last.agreed_price_pkr);
    }
  };

  const handleDone = () => {
    if (finalDeal && onAgreed) onAgreed(finalDeal);
    onClose();
    setTimeout(() => {
      setRounds([]);
      setOfferText('');
      setFinalDeal(null);
    }, 300);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ maxHeight: '90%' }}
        >
          <View
            style={{
              backgroundColor: colors.bg.primary,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
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
                  marginRight: 12,
                }}
              >
                <Ionicons name="cash" size={20} color={colors.brand.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '800' }}>
                  {lang === 'ur' ? 'Bhao Karein' : 'Bargain'}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                  {providerName} · Agent 7 (Bargain)
                </Text>
              </View>
              <Pressable onPress={onClose}>
                <Ionicons name="close-circle" size={26} color={colors.text.tertiary} />
              </Pressable>
            </View>

            {/* Initial quote */}
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
              <Text
                style={{
                  color: colors.text.tertiary,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1,
                }}
              >
                {lang === 'ur' ? 'ORIGINAL QUOTE' : 'ORIGINAL QUOTE'}
              </Text>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 24,
                  fontWeight: '800',
                  letterSpacing: -0.4,
                  marginTop: 2,
                }}
              >
                PKR {initialPricePkr.toLocaleString()}
              </Text>
            </View>

            {/* Rounds */}
            <ScrollView
              style={{ maxHeight: 340 }}
              contentContainerStyle={{ padding: spacing.lg, gap: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {rounds.length === 0 ? (
                <View style={{ gap: 10 }}>
                  <View
                    style={{
                      backgroundColor: colors.bg.surfaceSolid,
                      borderRadius: radii.md,
                      padding: 14,
                    }}
                  >
                    <Text style={{ color: colors.text.secondary, fontSize: 13, lineHeight: 19 }}>
                      {lang === 'ur'
                        ? 'Apni offer dalain — Bargain Agent dekhega ke provider accept karega, counter dega ya reject.'
                        : "Enter your offer — Agent 7 simulates the provider's response: accept, counter, or reject."}
                    </Text>
                  </View>

                  {/* Quick suggestion chips */}
                  <Text
                    style={{
                      color: colors.text.tertiary,
                      fontSize: 10,
                      fontWeight: '700',
                      letterSpacing: 1,
                      marginTop: 4,
                    }}
                  >
                    {lang === 'ur' ? 'YA YEH OFFERS TRY KAREIN' : 'OR TRY THESE OFFERS'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { label: lang === 'ur' ? '70% offer' : '70% offer', value: Math.round(initialPricePkr * 0.7) },
                      { label: lang === 'ur' ? '55% offer' : '55% offer', value: Math.round(initialPricePkr * 0.55) },
                      { label: lang === 'ur' ? '40% offer' : '40% offer', value: Math.round(initialPricePkr * 0.4) },
                      { label: lang === 'ur' ? '25% (lowball)' : '25% (lowball)', value: Math.round(initialPricePkr * 0.25) },
                    ].map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => submitOffer(opt.value)}
                        disabled={loading}
                        style={({ pressed }) => ({
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: radii.pill,
                          backgroundColor: colors.brand.accent + '18',
                          borderWidth: 1,
                          borderColor: colors.brand.accent + '40',
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text
                          style={{
                            color: colors.brand.accent,
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          PKR {opt.value.toLocaleString()} · {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                rounds.map((r, i) => (
                  <MotiView
                    key={i}
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 250 }}
                    style={{ gap: 6 }}
                  >
                    {/* Customer bubble */}
                    <View style={{ alignSelf: 'flex-end', maxWidth: '78%' }}>
                      <View
                        style={{
                          backgroundColor: colors.brand.primary,
                          borderRadius: 18,
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                          {lang === 'ur' ? 'Meri offer: ' : 'My offer: '}PKR {r.customer_offered.toLocaleString()}
                        </Text>
                      </View>
                      <Text style={{ color: colors.text.quaternary, fontSize: 10, alignSelf: 'flex-end', marginTop: 2 }}>
                        Round {r.round}
                      </Text>
                    </View>

                    {/* Provider response bubble */}
                    <View style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                      <View
                        style={{
                          backgroundColor:
                            r.decision === 'accept'
                              ? colors.semantic.success + '22'
                              : r.decision === 'reject'
                              ? colors.semantic.danger + '22'
                              : colors.bg.surfaceSolid,
                          borderRadius: 18,
                          padding: 12,
                          gap: 6,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons
                            name={
                              r.decision === 'accept'
                                ? 'checkmark-circle'
                                : r.decision === 'reject'
                                ? 'close-circle'
                                : 'swap-horizontal'
                            }
                            size={14}
                            color={
                              r.decision === 'accept'
                                ? colors.semantic.success
                                : r.decision === 'reject'
                                ? colors.semantic.danger
                                : colors.brand.accent
                            }
                          />
                          <Text
                            style={{
                              color:
                                r.decision === 'accept'
                                  ? colors.semantic.success
                                  : r.decision === 'reject'
                                  ? colors.semantic.danger
                                  : colors.brand.accent,
                              fontSize: 11,
                              fontWeight: '800',
                              letterSpacing: 0.6,
                            }}
                          >
                            {r.decision === 'accept'
                              ? lang === 'ur'
                                ? 'ACCEPT'
                                : 'ACCEPTED'
                              : r.decision === 'reject'
                              ? lang === 'ur'
                                ? 'REJECT'
                                : 'REJECTED'
                              : lang === 'ur'
                              ? 'COUNTER'
                              : 'COUNTER-OFFER'}
                          </Text>
                          {r.agreed_price_pkr ? (
                            <Text
                              style={{
                                color: colors.text.primary,
                                fontSize: 14,
                                fontWeight: '800',
                                marginLeft: 4,
                              }}
                            >
                              PKR {r.agreed_price_pkr.toLocaleString()}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={{ color: colors.text.primary, fontSize: 13, lineHeight: 18 }}>
                          {r.provider_message_ur}
                        </Text>
                        <Text style={{ color: colors.text.tertiary, fontSize: 11, lineHeight: 16, fontStyle: 'italic' }}>
                          {lang === 'ur' ? r.reasoning_ur : r.reasoning_en}
                        </Text>
                      </View>
                    </View>
                  </MotiView>
                ))
              )}

              {/* Show counter-accept button */}
              {!finalDeal &&
              rounds.length > 0 &&
              rounds[rounds.length - 1].decision === 'counter' ? (
                <Pressable
                  onPress={handleAcceptCounter}
                  style={({ pressed }) => ({
                    marginTop: 6,
                    paddingVertical: 12,
                    borderRadius: radii.pill,
                    backgroundColor: colors.semantic.success,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
                    {lang === 'ur' ? 'Counter Accept Karein' : 'Accept Counter'} (PKR{' '}
                    {rounds[rounds.length - 1].agreed_price_pkr?.toLocaleString()})
                  </Text>
                </Pressable>
              ) : null}

              {/* Final deal */}
              {finalDeal ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    marginTop: 6,
                    padding: 16,
                    borderRadius: radii.lg,
                    backgroundColor: colors.semantic.success + '15',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      color: colors.semantic.success,
                      fontSize: 11,
                      fontWeight: '800',
                      letterSpacing: 1,
                    }}
                  >
                    {lang === 'ur' ? 'DEAL FINAL' : 'DEAL AGREED'}
                  </Text>
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 28,
                      fontWeight: '800',
                      letterSpacing: -0.5,
                    }}
                  >
                    PKR {finalDeal.toLocaleString()}
                  </Text>
                  <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
                    {lang === 'ur' ? 'Bachat: ' : 'You saved: '}PKR{' '}
                    {(initialPricePkr - finalDeal).toLocaleString()} (
                    {Math.round(((initialPricePkr - finalDeal) / initialPricePkr) * 100)}%)
                  </Text>
                </MotiView>
              ) : null}
            </ScrollView>

            {/* Input row */}
            {canBargain ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: spacing.lg,
                  paddingTop: spacing.md,
                  borderTopWidth: 0.5,
                  borderTopColor: colors.border.divider,
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
                    value={offerText}
                    onChangeText={setOfferText}
                    placeholder={lang === 'ur' ? '2,500' : '2,500'}
                    placeholderTextColor={colors.text.placeholder}
                    keyboardType="numeric"
                    style={{
                      flex: 1,
                      color: colors.text.primary,
                      paddingVertical: 12,
                      fontSize: 15,
                      fontWeight: '700',
                    }}
                    onSubmitEditing={handleSubmitOffer}
                  />
                </View>
                <Pressable
                  onPress={handleSubmitOffer}
                  disabled={loading || !offerText.trim()}
                  style={({ pressed }) => ({
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: offerText.trim() ? colors.brand.primary : colors.bg.elevated,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={18} color={offerText.trim() ? '#fff' : colors.text.tertiary} />
                  )}
                </Pressable>
              </View>
            ) : null}

            {/* Done button */}
            {finalDeal ? (
              <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
                <Pressable
                  onPress={handleDone}
                  style={({ pressed }) => ({
                    paddingVertical: 14,
                    borderRadius: radii.pill,
                    backgroundColor: colors.brand.primary,
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                    {lang === 'ur' ? 'Iss rate pe Book Karein' : `Book at PKR ${finalDeal.toLocaleString()}`}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
