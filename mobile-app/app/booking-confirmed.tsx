/**
 * Booking Confirmed — Apple-style flow with REAL pending-acceptance state.
 *
 * Initially the booking is in `pending_provider_acceptance` status. The screen
 * shows a "waiting for provider" UI and polls /api/bookings/{id}/status every
 * 3s until the provider accepts (status=confirmed) or declines.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { GradientButton } from '../src/components/GradientButton';
import { CancelBookingSheet } from '../src/components/CancelBookingSheet';
import { RatingModal } from '../src/components/RatingModal';
import { fetchBookingStatus, cancelBooking, fetchBookings, customerCounterResponse } from '../src/services/api';

export default function BookingConfirmedScreen() {
  const router = useRouter();
  const { lang, t, currentBooking, setCurrentBooking, currentTrace, user, colors } = useApp();
  const [status, setStatus] = useState<string>(currentBooking?.booking?.status || 'pending_provider_acceptance');
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(!currentBooking);
  const [showRating, setShowRating] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<any>(null);
  const [providerCounterPkr, setProviderCounterPkr] = useState<number | null>(null);
  const [respondingToCounter, setRespondingToCounter] = useState(false);

  // Fallback: if user reloaded the page or deep-linked, restore latest booking
  useEffect(() => {
    if (currentBooking) {
      setHydrating(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBookings(user.id);
        const latest = data?.bookings?.[0];
        if (!cancelled && latest) {
          setCurrentBooking({
            booking: latest,
            followup_plan: latest.followup_plan,
            trace_id: latest.trace_id,
          });
          setStatus(latest.status);
        }
      } catch {}
      if (!cancelled) setHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentBooking, user.id]);

  // Poll the backend every 3s for status changes
  useEffect(() => {
    if (!currentBooking?.booking?.booking_id) return;
    if (status === 'confirmed' || status === 'declined_by_provider') return;
    const id = setInterval(async () => {
      try {
        const data = await fetchBookingStatus(currentBooking.booking.booking_id);
        if (data?.status && data.status !== status) {
          setStatus(data.status);
          setAcceptedAt(data.accepted_at || null);
        }
        // Capture provider counter if present
        if (data?.provider_counter_pkr && data.provider_counter_pkr !== providerCounterPkr) {
          setProviderCounterPkr(data.provider_counter_pkr);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, [currentBooking?.booking?.booking_id, status, providerCounterPkr]);

  const handleAcceptProviderCounter = async () => {
    if (!currentBooking?.booking?.booking_id || !providerCounterPkr) return;
    setRespondingToCounter(true);
    try {
      const res = await customerCounterResponse(currentBooking.booking.booking_id, {
        action: 'accept',
      });
      if (res?.success) {
        setStatus('confirmed');
        // Update local booking pricing
        if (currentBooking?.booking) {
          const updated = { ...currentBooking };
          updated.booking = {
            ...updated.booking,
            status: 'confirmed',
            pricing: {
              ...(updated.booking.pricing || {}),
              final_pkr: providerCounterPkr,
              bargained: true,
            },
          };
          setCurrentBooking(updated);
        }
      }
    } catch {}
    setRespondingToCounter(false);
  };

  if (hydrating) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title={t.booking.confirmTitle} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand.textAccent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentBooking) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title={t.booking.confirmTitle} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Ionicons name="receipt-outline" size={48} color={colors.text.tertiary} />
          <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '700', marginTop: 12 }}>
            {lang === 'ur' ? 'Koi recent booking nahi' : 'No recent booking'}
          </Text>
          <Text style={{ color: colors.text.tertiary, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
            {lang === 'ur'
              ? 'Pehle home se ek service request bhejein'
              : 'Submit a service request from home first'}
          </Text>
          <GradientButton
            label={lang === 'ur' ? 'Home Wapas' : 'Go Home'}
            icon="home"
            onPress={() => router.replace('/')}
            variant="primary"
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }
  const b = currentBooking.booking;
  const fu = currentBooking.followup_plan;
  const isPending = status === 'pending_provider_acceptance';
  const isDeclined = status === 'declined_by_provider';
  const isConfirmed = status === 'confirmed';
  const hasProviderCounter = status === 'pending_customer_counter_response' && !!providerCounterPkr;
  const isCancelled = status === 'cancelled_by_customer' || status === 'cancelled_by_provider';
  const cancelledByCustomer = status === 'cancelled_by_customer';
  const cancelledByProvider = status === 'cancelled_by_provider';

  const handleCancel = async ({ reason_code, reason }: { reason_code: string; reason: string }) => {
    const res = await cancelBooking(b.booking_id, {
      by_party: 'customer',
      reason_code,
      reason,
    });
    if (res?.success) {
      setStatus(res.new_status);
      setCancelReason(reason);
    }
  };

  const heroColor = isConfirmed
    ? colors.semantic.success
    : isDeclined || isCancelled
    ? colors.semantic.danger
    : colors.ios.orange;
  const heroGradient: readonly [string, string] = isConfirmed
    ? colors.brand.gradientSuccess
    : isDeclined || isCancelled
    ? ['#FF453A', '#FF9F0A']
    : ['#FF9F0A', '#FF375F'];
  const heroIcon: any = isConfirmed
    ? 'checkmark'
    : isCancelled
    ? 'trash'
    : isDeclined
    ? 'close'
    : 'time';
  const heroTitle = isConfirmed
    ? lang === 'ur'
      ? 'Booking Confirm!'
      : 'Booking Confirmed!'
    : isCancelled
    ? lang === 'ur'
      ? 'Booking Cancel Ho Gayi'
      : 'Booking Cancelled'
    : isDeclined
    ? lang === 'ur'
      ? 'Booking Decline'
      : 'Provider Declined'
    : lang === 'ur'
    ? 'Provider Ka Intezaar...'
    : 'Awaiting Provider...';
  const heroSubtitle = isConfirmed
    ? lang === 'ur'
      ? `${b.provider.business_name} ne accept kar liya`
      : `${b.provider.business_name} accepted`
    : cancelledByCustomer
    ? lang === 'ur'
      ? 'Aap ne yeh booking cancel ki'
      : 'You cancelled this booking'
    : cancelledByProvider
    ? lang === 'ur'
      ? `${b.provider.business_name} ne cancel kar di`
      : `${b.provider.business_name} cancelled`
    : isDeclined
    ? lang === 'ur'
      ? 'Doosra provider try karein'
      : 'Try booking another provider'
    : lang === 'ur'
    ? `${b.provider.business_name} ko notification gayi`
    : `Sent to ${b.provider.business_name} — awaiting accept`;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title={t.booking.confirmTitle} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — calm, monochrome */}
        <MotiView
          from={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180 }}
          style={{ alignItems: 'center', marginVertical: spacing.lg }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: heroColor + '18',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: heroColor + '33',
            }}
          >
            {isPending ? (
              <MotiView
                from={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.35, opacity: 0 }}
                transition={{ type: 'timing', duration: 1300, loop: true }}
                style={{
                  position: 'absolute',
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: heroColor + '33',
                }}
              />
            ) : null}
            <Ionicons name={heroIcon} size={32} color={heroColor} />
          </View>
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 22,
              fontWeight: '700',
              marginTop: spacing.md,
              letterSpacing: -0.6,
              textAlign: 'center',
            }}
          >
            {heroTitle}
          </Text>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 14,
              marginTop: 4,
              letterSpacing: -0.2,
              textAlign: 'center',
              paddingHorizontal: 20,
              lineHeight: 19,
            }}
          >
            {heroSubtitle}
          </Text>
          <View
            style={{
              backgroundColor: colors.bg.surface,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: radii.pill,
              marginTop: spacing.md,
              borderWidth: 1,
              borderColor: heroColor + '44',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isPending ? (
              <MotiView
                from={{ opacity: 1 }}
                animate={{ opacity: 0.3 }}
                transition={{ type: 'timing', duration: 700, loop: true, repeatReverse: true }}
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: heroColor }}
              />
            ) : null}
            <Text
              style={{
                color: heroColor,
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 0.4,
              }}
            >
              {b.booking_id}
              {isPending
                ? lang === 'ur'
                  ? ' · PENDING'
                  : ' · PENDING'
                : isConfirmed
                ? ' · CONFIRMED'
                : ' · DECLINED'}
            </Text>
          </View>
          {isPending ? (
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 11,
                marginTop: 10,
                textAlign: 'center',
              }}
            >
              {lang === 'ur'
                ? '🔄 Live polling · Provider screen pe accept karte he yahan update hoga'
                : '🔄 Live polling · Updates when provider taps Accept'}
            </Text>
          ) : null}

          {/* Cancel button — only while pending or freshly confirmed */}
          {(isPending || isConfirmed) ? (
            <Pressable
              onPress={() => setShowCancelSheet(true)}
              style={({ pressed }) => ({
                marginTop: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: colors.semantic.danger + '55',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="close-circle-outline" size={14} color={colors.semantic.danger} />
              <Text
                style={{
                  color: colors.semantic.danger,
                  fontSize: 12,
                  fontWeight: '700',
                  letterSpacing: -0.1,
                }}
              >
                {lang === 'ur' ? 'Booking Cancel Karein' : 'Cancel Booking'}
              </Text>
            </Pressable>
          ) : null}

          {/* Cancellation reason display */}
          {isCancelled && cancelReason ? (
            <View
              style={{
                marginTop: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: radii.md,
                backgroundColor: colors.semantic.danger + '12',
                borderWidth: 1,
                borderColor: colors.semantic.danger + '44',
                maxWidth: 400,
              }}
            >
              <Text
                style={{
                  color: colors.semantic.danger,
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                {lang === 'ur' ? 'CANCELLATION KI WAJAH' : 'CANCELLATION REASON'}
              </Text>
              <Text style={{ color: colors.text.primary, fontSize: 13, lineHeight: 18 }}>
                {cancelReason}
              </Text>
            </View>
          ) : null}
        </MotiView>

        <CancelBookingSheet
          visible={showCancelSheet}
          onClose={() => setShowCancelSheet(false)}
          onConfirm={handleCancel}
          byParty="customer"
          lang={lang}
        />

        {/* PROVIDER COUNTER-OFFER notification */}
        {hasProviderCounter ? (
          <View
            style={{
              padding: 14,
              borderRadius: radii.lg,
              backgroundColor: colors.brand.accent + '15',
              borderWidth: 1,
              borderColor: colors.brand.accent + '40',
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: colors.brand.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="swap-horizontal" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '800' }}>
                  {lang === 'ur' ? 'Provider ne Counter Offer ki' : 'Provider counter-offered'}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                  {b.provider?.business_name}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
                {lang === 'ur' ? 'Naya price:' : 'New price:'}
              </Text>
              <Text style={{ color: colors.text.primary, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>
                PKR {providerCounterPkr?.toLocaleString()}
              </Text>
            </View>
            <Text style={{ color: colors.text.secondary, fontSize: 12, lineHeight: 17 }}>
              {lang === 'ur'
                ? `Bhai PKR ${providerCounterPkr?.toLocaleString()} kar do, isse kam mushkil hai. Aap accept karein to booking confirm ho jaye gi.`
                : `Provider proposes PKR ${providerCounterPkr?.toLocaleString()}. Accept to confirm the booking.`}
            </Text>
            <Pressable
              onPress={handleAcceptProviderCounter}
              disabled={respondingToCounter}
              style={({ pressed }) => ({
                paddingVertical: 12,
                borderRadius: radii.pill,
                backgroundColor: colors.semantic.success,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {respondingToCounter ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                    {lang === 'ur'
                      ? `Accept @ PKR ${providerCounterPkr?.toLocaleString()}`
                      : `Accept @ PKR ${providerCounterPkr?.toLocaleString()}`}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* Receipt */}
        <GlassCard>
          <SectionHeader
            icon="receipt-outline"
            label={lang === 'ur' ? 'RASEED' : 'RECEIPT'}
            right={b.receipt.receipt_id}
          />
          {b.receipt.lines.map((line: any, i: number) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 10,
                borderBottomWidth: i < b.receipt.lines.length - 1 ? 1 : 0,
                borderBottomColor: colors.border.subtle,
                gap: 12,
              }}
            >
              <Text style={{ color: colors.text.tertiary, fontSize: 13, fontWeight: '500' }}>
                {line.label}
              </Text>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 13,
                  fontWeight: '600',
                  flex: 1,
                  textAlign: 'right',
                  letterSpacing: -0.2,
                }}
              >
                {line.value}
              </Text>
            </View>
          ))}
          <View
            style={{
              marginTop: spacing.md,
              alignItems: 'center',
              backgroundColor: colors.bg.elevated,
              paddingVertical: 14,
              borderRadius: radii.md,
            }}
          >
            <Ionicons name="qr-code-outline" size={34} color={colors.text.secondary} />
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 11,
                marginTop: 6,
                fontWeight: '500',
              }}
            >
              {b.receipt.qr_payload}
            </Text>
          </View>
        </GlassCard>

        {/* Notifications */}
        <GlassCard>
          <SectionHeader
            icon="paper-plane-outline"
            label={lang === 'ur' ? 'NOTIFICATIONS' : 'NOTIFICATIONS'}
          />
          <NotificationLine
            icon="phone-portrait"
            color={colors.ios.blue}
            channel="In-App"
            text={b.notifications.user_in_app}
          />
          <NotificationLine
            icon="chatbox-ellipses"
            color={colors.ios.green}
            channel="SMS"
            text={b.notifications.user_sms}
          />
          <NotificationLine
            icon="logo-whatsapp"
            color={colors.ios.green}
            channel="WhatsApp → Provider"
            text={b.notifications.provider_whatsapp}
          />
        </GlassCard>

        {/* State changes */}
        <GlassCard>
          <SectionHeader
            icon="layers-outline"
            label={lang === 'ur' ? 'SYSTEM STATE CHANGES' : 'SYSTEM STATE CHANGES'}
          />
          {b.system_state_changes.map((c: any, i: number) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                paddingVertical: 7,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.semantic.success}
                style={{ marginTop: 2 }}
              />
              <Text style={{ color: colors.text.secondary, fontSize: 12, flex: 1, lineHeight: 18 }}>
                <Text style={{ fontWeight: '700', color: colors.text.primary }}>{c.type}</Text>{' '}
                <Text style={{ color: colors.text.tertiary }}>
                  {Object.entries(c)
                    .filter(([k]) => k !== 'type')
                    .map(([k, v]) => `${k}=${v}`)
                    .join(', ')}
                </Text>
              </Text>
            </View>
          ))}
        </GlassCard>

        {/* Pricing Engine breakdown (if available) */}
        {b.pricing?.breakdown_lines ? (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="calculator" size={13} color={colors.ios.green} />
              <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>
                {lang === 'ur' ? 'PRICING BREAKDOWN' : 'PRICING BREAKDOWN'}
              </Text>
            </View>
            {b.pricing.breakdown_lines.map((line: any, i: number) => {
              const negative = line.value_pkr < 0;
              const dim = line.value_pkr === 0;
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 5,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text.primary, fontSize: 12, fontWeight: '600' }}>
                      {line.label}
                    </Text>
                    <Text style={{ color: colors.text.tertiary, fontSize: 10, marginTop: 1 }}>
                      {line.detail}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: dim
                        ? colors.text.tertiary
                        : negative
                        ? colors.semantic.danger
                        : colors.text.primary,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {negative ? '-' : ''}PKR {Math.abs(line.value_pkr).toLocaleString()}
                  </Text>
                </View>
              );
            })}
            <View
              style={{
                marginTop: 8,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: colors.border.subtle,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '800' }}>
                {lang === 'ur' ? 'TOTAL' : 'TOTAL'}
              </Text>
              <Text style={{ color: colors.brand.textAccent, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>
                PKR {b.pricing.final_pkr?.toLocaleString?.()}
              </Text>
            </View>
          </GlassCard>
        ) : null}

        {/* Service Guarantee Badge */}
        <GlassCard variant="tinted" tintColor={colors.ios.green}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: colors.ios.green + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="shield-checkmark" size={18} color={colors.ios.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '700', letterSpacing: -0.2 }}>
                {lang === 'ur' ? 'Khidmat Guarantee' : 'Khidmat Guarantee'}
              </Text>
              <Text style={{ color: colors.text.secondary, fontSize: 11, marginTop: 2, lineHeight: 16 }}>
                {lang === 'ur'
                  ? 'Service kharab hui to 100% refund. 24 ghante mein issue resolution.'
                  : 'Service bad? 100% refund. Issue resolution within 24 hours.'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* CTAs */}
        {!isCancelled && !isDeclined ? (
          <GradientButton
            label={lang === 'ur' ? 'Provider Se Chat Karein' : 'Chat with Provider'}
            icon="chatbubbles"
            onPress={() => router.push(`/chat/${b.booking_id}`)}
            variant="soft"
          />
        ) : null}
        {isConfirmed ? (
          <GradientButton
            label={lang === 'ur' ? 'Service Rate Karein' : 'Rate this Service'}
            icon="star"
            onPress={() => setShowRating(true)}
            variant="secondary"
          />
        ) : null}

        {feedbackResult ? (
          <GlassCard variant="tinted" tintColor={colors.ios.yellow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="star" size={18} color={colors.ios.yellow} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '700' }}>
                  {lang === 'ur'
                    ? `Aap ne ${feedbackResult.rating_submitted}★ diya. Shukria!`
                    : `You rated ${feedbackResult.rating_submitted}★. Thank you!`}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                  {lang === 'ur'
                    ? `Provider ki nayi rating: ${feedbackResult.provider_rating_now}★`
                    : `Provider's new rating: ${feedbackResult.provider_rating_now}★`}
                </Text>
              </View>
            </View>
          </GlassCard>
        ) : null}

        <RatingModal
          visible={showRating}
          onClose={() => setShowRating(false)}
          bookingId={b.booking_id}
          providerName={b.provider.business_name}
          onSubmitted={(r) => setFeedbackResult(r)}
        />

        <GradientButton
          label={`${t.booking.timeline}  ·  ${fu?.total_events_scheduled || 0} events`}
          icon="time-outline"
          onPress={() => router.push('/timeline')}
          variant="secondary"
          size="lg"
          style={{ marginTop: spacing.md }}
        />
        {/* Live Provider Tracking — visible once booking is confirmed */}
        {isConfirmed && b?.booking_id ? (
          <GradientButton
            label={lang === 'ur' ? 'Provider ko Live Track Karein' : 'Track Provider Live'}
            icon="navigate"
            onPress={() => router.push(`/track/${b.booking_id}`)}
            variant="primary"
            size="lg"
          />
        ) : null}
        <GradientButton
          label={lang === 'ur' ? 'Agent Trace Dekhein (Logs)' : 'View Agent Trace (Logs)'}
          icon="git-network"
          onPress={() => {
            const tid = currentBooking?.trace_id || currentTrace?.trace_id;
            if (tid) router.push(`/trace/${tid}`);
            else router.push('/history');
          }}
          variant="secondary"
          size="lg"
        />
        <GradientButton
          label={lang === 'ur' ? 'Naya Booking' : 'New Booking'}
          icon="add"
          onPress={() => router.replace('/')}
          variant="soft"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const SectionHeader = ({ icon, label, right }: any) => {
  const { colors } = useApp();
  return (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={icon} size={13} color={colors.text.tertiary} />
      <Text
        style={{
          color: colors.text.tertiary,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
        }}
      >
        {label}
      </Text>
    </View>
    {right ? (
      <Text style={{ color: colors.text.quaternary, fontSize: 11, fontWeight: '500' }}>
        {right}
      </Text>
    ) : null}
  </View>
  );
};

const NotificationLine = ({ icon, channel, text, color }: any) => {
  const { colors } = useApp();
  return (
  <View
    style={{
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    }}
  >
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: (color || colors.brand.primary) + '20',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={14} color={color || colors.brand.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: colors.text.secondary,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
        }}
      >
        {channel.toUpperCase()}
      </Text>
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 13,
          marginTop: 2,
          lineHeight: 18,
          letterSpacing: -0.2,
        }}
        numberOfLines={4}
      >
        {text}
      </Text>
    </View>
  </View>
  );
};
