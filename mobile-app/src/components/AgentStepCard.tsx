/**
 * Theme-aware animated agent step card.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors as iconPalette, radii } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';

type Props = {
  agentKey:
    | 'intent_parser'
    | 'provider_discovery'
    | 'ranking_reasoning'
    | 'crisis_specialist'
    | 'booking_executor'
    | 'followup_automator';
  title: string;
  subtitle?: string;
  status: 'pending' | 'active' | 'done';
  toolCalls?: number;
  duration_ms?: number;
  index?: number;
};

const agentMeta = {
  intent_parser: { color: iconPalette.agent.intent, icon: 'language' as const, label: 'Intent Parser' },
  provider_discovery: { color: iconPalette.agent.discovery, icon: 'search' as const, label: 'Provider Discovery' },
  ranking_reasoning: { color: iconPalette.agent.ranking, icon: 'sparkles' as const, label: 'Ranking & Reasoning' },
  crisis_specialist: { color: iconPalette.agent.crisis, icon: 'alert' as const, label: 'Crisis Specialist' },
  booking_executor: { color: iconPalette.agent.booking, icon: 'checkmark-done' as const, label: 'Booking Executor' },
  followup_automator: { color: iconPalette.agent.followup, icon: 'time' as const, label: 'Follow-up Automator' },
};

export const AgentStepCard = ({
  agentKey,
  title,
  subtitle,
  status,
  toolCalls,
  duration_ms,
  index = 0,
}: Props) => {
  const { colors } = useTheme();
  const meta = agentMeta[agentKey];

  return (
    <MotiView
      from={{ opacity: 0, translateX: -12 }}
      animate={{ opacity: status === 'pending' ? 0.35 : 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 320, delay: index * 70 }}
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        borderRadius: radii.lg,
        backgroundColor: status === 'active' ? meta.color + '10' : colors.bg.surfaceSolid,
        borderWidth: 1,
        borderColor: status === 'active' ? meta.color + '55' : colors.border.subtle,
      }}
    >
      <View style={{ alignItems: 'center', gap: 6 }}>
        {status === 'active' ? (
          <MotiView
            from={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ type: 'timing', duration: 1100, loop: true }}
            style={{
              position: 'absolute',
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: meta.color + '55',
            }}
          />
        ) : null}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: meta.color + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              color: colors.text.primary,
              fontWeight: '700',
              fontSize: 15,
              letterSpacing: -0.3,
            }}
          >
            {meta.label}
          </Text>
          {status === 'done' ? (
            <Ionicons name="checkmark-circle" size={18} color={colors.semantic.success} />
          ) : status === 'active' ? (
            <MotiView
              from={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 600, loop: true, repeatReverse: true }}
            >
              <Ionicons name="ellipse" size={10} color={meta.color} />
            </MotiView>
          ) : (
            <Ionicons name="ellipse-outline" size={14} color={colors.text.quaternary} />
          )}
        </View>
        <Text
          style={{ color: colors.text.secondary, fontSize: 13, marginTop: 3, lineHeight: 18 }}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 5 }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
        {(toolCalls != null || duration_ms != null) && status === 'done' ? (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            {toolCalls != null ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="construct" size={11} color={colors.text.tertiary} />
                <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '500' }}>
                  {toolCalls} tools
                </Text>
              </View>
            ) : null}
            {duration_ms != null ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="flash" size={11} color={colors.text.tertiary} />
                <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '500' }}>
                  {duration_ms} ms
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </MotiView>
  );
};
