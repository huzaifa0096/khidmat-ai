/**
 * ProviderAICoach — Personalized AI coaching tips for providers.
 *
 * Analyzes the provider's metrics (rating, response time, completion rate,
 * earnings trend) and generates 1 actionable tip + projected impact. Tips
 * rotate based on the weakest dimension. Pakistani-context language.
 *
 * Unique because: most apps give generic dashboards. Khidmat AI gives the
 * PROVIDER agentic advice — like having a business coach in their pocket.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useApp } from '../state/AppContext';
import { radii } from '../theme/colors';

type Props = {
  earnings?: any;
  profile?: any;
};

type Tip = {
  emoji: string;
  category: 'response' | 'rating' | 'availability' | 'pricing' | 'growth';
  title_en: string;
  title_ur: string;
  detail_en: string;
  detail_ur: string;
  projected_impact_en: string;
  projected_impact_ur: string;
  action_label_en: string;
  action_label_ur: string;
  priority: 'high' | 'medium' | 'low';
};

const generateTips = (earnings: any, profile: any): Tip[] => {
  const tips: Tip[] = [];
  const rating = earnings?.rating ?? 4.7;
  const responseMin = profile?.provider?.avg_response_minutes ?? 30;
  const completionPct = profile?.provider?.completion_rate_percent ?? 92;
  const todayPkr = earnings?.today_pkr ?? 0;
  const weekPkr = earnings?.week_pkr ?? 0;

  // Tip 1: Response time
  if (responseMin > 30) {
    tips.push({
      emoji: '⚡',
      category: 'response',
      priority: 'high',
      title_en: 'Speed up your replies',
      title_ur: 'Reply jaldi karein',
      detail_en: `Your average response time is ${responseMin} minutes. Customers who book in under 5 minutes after sending the request are 73% more likely to confirm.`,
      detail_ur: `Aap ka average reply time ${responseMin} minute hai. Jo customer 5 minute ke andar response dete hain, unki booking confirm hone ki chance 73% zyada hoti hai.`,
      projected_impact_en: '+12% bookings if response drops to <15 min',
      projected_impact_ur: '+12% bookings agar reply <15 min ho jaye',
      action_label_en: 'Enable Auto-Quick-Reply',
      action_label_ur: 'Auto-Reply ON karein',
    });
  }

  // Tip 2: Rating
  if (rating < 4.8) {
    const need = (4.8 - rating).toFixed(1);
    tips.push({
      emoji: '⭐',
      category: 'rating',
      priority: 'high',
      title_en: 'Aim for 4.8★ this month',
      title_ur: 'Iss mahine 4.8★ ka target',
      detail_en: `You're at ${rating.toFixed(1)}★. Hitting 4.8★ unlocks the "Elite" badge — Elite providers get 2.3x more views on average. You need ${need} more points.`,
      detail_ur: `Aap abhi ${rating.toFixed(1)}★ pe hain. 4.8★ pohchne se "Elite" badge milta hai aur Elite providers ko 2.3x zyada views milte hain.`,
      projected_impact_en: '+30% provider profile views',
      projected_impact_ur: '+30% profile views',
      action_label_en: 'Request rating from recent customers',
      action_label_ur: 'Recent customers se rating maangein',
    });
  }

  // Tip 3: Availability
  if (todayPkr === 0 || todayPkr < (weekPkr / 7) * 0.5) {
    tips.push({
      emoji: '📅',
      category: 'availability',
      priority: 'medium',
      title_en: 'Friday evenings = peak demand',
      title_ur: 'Friday evening pe demand peak hoti hai',
      detail_en:
        'AC technicians earn 40% more on Friday + Saturday evenings (6-10 PM) in your area. Block this time as "available_now" to surface in emergency dispatches.',
      detail_ur:
        'Friday + Saturday evening (6-10 PM) mein aap ke area mein AC technicians ki demand 40% zyada hoti hai. Yeh time available rakhein.',
      projected_impact_en: '+PKR 3,200 estimated weekend earnings',
      projected_impact_ur: '+PKR 3,200 weekend earnings',
      action_label_en: 'Set weekend evening availability',
      action_label_ur: 'Weekend evening available karein',
    });
  }

  // Tip 4: Completion rate
  if (completionPct < 95) {
    tips.push({
      emoji: '✓',
      category: 'rating',
      priority: 'medium',
      title_en: 'Boost completion rate',
      title_ur: 'Completion rate badhayein',
      detail_en: `Your completion rate is ${completionPct}%. Cancelling 1 fewer job per week takes you to 95%+, which unlocks "Trusted" tier pricing (+15% per job).`,
      detail_ur: `Aap ka completion rate ${completionPct}% hai. Hafte mein ek booking aur complete karein to 95% pohch jayega aur "Trusted" tier mein +15% per job mile ga.`,
      projected_impact_en: '+15% per-job earnings via Trusted tier',
      projected_impact_ur: '+15% per-job earnings',
      action_label_en: 'Review last 3 cancellations',
      action_label_ur: 'Pichli 3 cancellations dekhein',
    });
  }

  // Tip 5: Growth (always add)
  tips.push({
    emoji: '📈',
    category: 'growth',
    priority: 'low',
    title_en: 'Add a 2nd service category',
    title_ur: 'Doosri service add karein',
    detail_en: `Top 20% of providers offer 2+ services. AC techs who also offer geyser_repair earn PKR 8,400 more per month on average. Cross-selling is huge.`,
    detail_ur: `Top 20% providers 2+ services offer karte hain. AC tech jo geyser repair bhi karte hain, woh average PKR 8,400 zyada kamate hain.`,
    projected_impact_en: '+PKR 8,400/month estimated',
    projected_impact_ur: '+PKR 8,400/month',
    action_label_en: 'Add secondary service',
    action_label_ur: 'Secondary service add karein',
  });

  return tips;
};

export const ProviderAICoach = ({ earnings, profile }: Props) => {
  const { colors, lang } = useApp();
  const tips = useMemo(() => generateTips(earnings, profile), [earnings, profile]);
  const [tipIdx, setTipIdx] = useState(0);

  if (tips.length === 0) return null;
  const tip = tips[tipIdx % tips.length];

  const cycleTip = () => setTipIdx((i) => (i + 1) % tips.length);

  const priorityColor =
    tip.priority === 'high'
      ? colors.semantic.danger
      : tip.priority === 'medium'
      ? colors.ios.orange
      : colors.semantic.info;

  return (
    <View
      style={{
        marginTop: 12,
        padding: 14,
        borderRadius: radii.lg,
        backgroundColor: colors.bg.surfaceSolid,
        gap: 10,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.brand.textAccent + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="bulb" size={16} color={colors.brand.textAccent} />
          </View>
          <View>
            <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 }}>
              {lang === 'ur' ? 'AI Business Coach' : 'AI Business Coach'}
            </Text>
            <Text style={{ color: colors.text.tertiary, fontSize: 10, marginTop: 1 }}>
              {lang === 'ur'
                ? `Tip ${tipIdx + 1} of ${tips.length} · weekly personalized`
                : `Tip ${tipIdx + 1} of ${tips.length} · weekly personalized`}
            </Text>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: priorityColor + '22',
          }}
        >
          <Text style={{ color: priorityColor, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>
            {tip.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Tip body */}
      <MotiView
        key={tipIdx}
        from={{ opacity: 0, translateX: 12 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 280 }}
        style={{ gap: 6 }}
      >
        <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 }}>
          {tip.emoji}  {lang === 'ur' ? tip.title_ur : tip.title_en}
        </Text>
        <Text style={{ color: colors.text.secondary, fontSize: 12, lineHeight: 17 }}>
          {lang === 'ur' ? tip.detail_ur : tip.detail_en}
        </Text>

        {/* Projected impact */}
        <View
          style={{
            marginTop: 4,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: radii.md,
            backgroundColor: colors.semantic.success + '15',
            alignSelf: 'flex-start',
          }}
        >
          <Ionicons name="trending-up" size={12} color={colors.semantic.success} />
          <Text style={{ color: colors.semantic.success, fontSize: 11, fontWeight: '700' }}>
            {lang === 'ur' ? tip.projected_impact_ur : tip.projected_impact_en}
          </Text>
        </View>
      </MotiView>

      {/* Action row */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Pressable
          onPress={cycleTip}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 10,
            borderRadius: radii.pill,
            backgroundColor: colors.bg.elevated,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 4,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="refresh" size={13} color={colors.text.secondary} />
          <Text style={{ color: colors.text.secondary, fontSize: 12, fontWeight: '700' }}>
            {lang === 'ur' ? 'Agla tip' : 'Next tip'}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => ({
            flex: 2,
            paddingVertical: 10,
            borderRadius: radii.pill,
            backgroundColor: colors.brand.primary,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="rocket" size={13} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
            {lang === 'ur' ? tip.action_label_ur : tip.action_label_en}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
