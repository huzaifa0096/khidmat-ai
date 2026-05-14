/**
 * Agent Roster — theme-aware row of 6 agent badges.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { colors as iconPalette, radii } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';

const AGENTS = [
  { id: 'intent', icon: 'language' as const, color: iconPalette.ios.cyan, name_en: 'Intent', name_ur: 'Intent' },
  { id: 'discovery', icon: 'search' as const, color: iconPalette.ios.purple, name_en: 'Discovery', name_ur: 'Discovery' },
  { id: 'ranking', icon: 'bar-chart' as const, color: iconPalette.ios.orange, name_en: 'Ranking', name_ur: 'Ranking' },
  { id: 'booking', icon: 'checkmark-done' as const, color: iconPalette.ios.green, name_en: 'Booking', name_ur: 'Booking' },
  { id: 'followup', icon: 'time' as const, color: iconPalette.ios.pink, name_en: 'Follow-up', name_ur: 'Follow-up' },
  { id: 'crisis', icon: 'alert' as const, color: iconPalette.ios.red, name_en: 'Crisis', name_ur: 'Crisis' },
];

export const AgentRoster = ({ lang }: { lang: 'ur' | 'en' }) => {
  const { colors } = useTheme();
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            color: colors.text.tertiary,
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 1.4,
          }}
        >
          {lang === 'ur' ? '6 AGENTS READY' : '6 AGENTS READY'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.semantic.success,
            }}
          />
          <Text
            style={{
              color: colors.semantic.success,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 0.6,
            }}
          >
            ALL ONLINE
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {AGENTS.map((a, i) => (
          <MotiView
            key={a.id}
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 320, delay: i * 65 }}
            style={{
              flex: 1,
              backgroundColor: colors.bg.surfaceSolid,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: a.color + '33',
              paddingVertical: 10,
              paddingHorizontal: 4,
              alignItems: 'center',
              gap: 4,
            }}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <MotiView
                from={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'timing', duration: 2200, loop: true, delay: i * 350 }}
                style={{
                  position: 'absolute',
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: a.color + '88',
                }}
              />
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: a.color + '22',
                  borderWidth: 1,
                  borderColor: a.color + '66',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={a.icon} size={11} color={a.color} />
              </View>
            </View>
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 9,
                fontWeight: '700',
                letterSpacing: 0.2,
              }}
              numberOfLines={1}
            >
              {lang === 'ur' ? a.name_ur : a.name_en}
            </Text>
          </MotiView>
        ))}
      </View>
    </View>
  );
};
