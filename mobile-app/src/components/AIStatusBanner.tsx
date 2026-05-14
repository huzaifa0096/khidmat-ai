/**
 * Live AI Status Banner — theme-aware live stats from backend.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../hooks/useTheme';
import { fetchStateSummary } from '../services/api';

type Stats = {
  providers_total: number;
  bookings_total: number;
  traces_total: number;
  events_total: number;
  emergency_tickets_total: number;
  alerts_total: number;
};

export const AIStatusBanner = ({ lang }: { lang: 'ur' | 'en' }) => {
  const { colors, radii } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      fetchStateSummary()
        .then((s) => {
          if (mounted) {
            setStats(s);
            setError(false);
          }
        })
        .catch(() => {
          if (mounted) setError(true);
        });
    };
    load();
    const id = setInterval(load, 8000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <View
      style={{
        backgroundColor: colors.bg.surfaceSolid,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        padding: 14,
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            } as any)
          : {}),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <MotiView
            from={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ type: 'timing', duration: 1800, loop: true }}
            style={{
              position: 'absolute',
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: error ? colors.semantic.danger : colors.semantic.success,
            }}
          />
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: error ? colors.semantic.danger : colors.semantic.success,
            }}
          />
        </View>
        <Text
          style={{
            color: error ? colors.semantic.danger : colors.semantic.success,
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 1.2,
          }}
        >
          {error
            ? 'BACKEND OFFLINE — START backend SERVER'
            : 'KHIDMAT AI ONLINE · 6 AGENTS · ANTIGRAVITY'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Stat icon="people" color={colors.ios.cyan} value={stats?.providers_total ?? 134} label="Providers" />
        <Stat icon="calendar" color={colors.ios.green} value={stats?.bookings_total ?? 0} label="Bookings" />
        <Stat icon="git-network" color={colors.ios.purple} value={stats?.traces_total ?? 0} label="Traces" />
        <Stat icon="alert" color={colors.ios.red} value={stats?.emergency_tickets_total ?? 0} label="Crises" />
      </View>
    </View>
  );
};

const Stat = ({ icon, color, value, label }: any) => {
  const { colors, radii } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.elevated,
        borderRadius: radii.sm,
        paddingVertical: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.subtle,
      }}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 16,
          fontWeight: '800',
          marginTop: 4,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: colors.text.tertiary,
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 0.6,
          marginTop: 1,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
};
