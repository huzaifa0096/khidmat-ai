/**
 * Premium mic hero — multi-layered with depth, highlight ring, and listening pulse.
 * Apple Watch / iOS Sound Recorder inspired.
 */
import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

type Props = {
  listening: boolean;
  onPress: () => void;
  size?: number;
};

export const PremiumMic = ({ listening, onPress, size = 130 }: Props) => {
  const { colors } = useTheme();
  const inner = size - 24;
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            width: size + 60,
            height: size + 60,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {listening ? (
            <>
              <MotiView
                from={{ scale: 0.85, opacity: 0.55 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ type: 'timing', duration: 1800, loop: true }}
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: colors.brand.primary,
                  opacity: 0.5,
                }}
              />
              <MotiView
                from={{ scale: 0.85, opacity: 0.4 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'timing', duration: 1600, loop: true, delay: 500 }}
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: colors.brand.accent,
                  opacity: 0.4,
                }}
              />
            </>
          ) : null}

          <View
            style={{
              position: 'absolute',
              width: size + 18,
              height: size + 18,
              borderRadius: (size + 18) / 2,
              borderWidth: 1,
              borderColor: colors.border.subtle,
            }}
          />

          <View
            style={{
              position: 'absolute',
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              backgroundColor: colors.brand.primary,
              opacity: 0.30,
              ...(Platform.OS === 'web' ? ({ filter: 'blur(28px)' } as any) : {}),
            }}
          />

          <MotiView
            animate={{ scale: pressed ? 0.94 : listening ? 1.04 : 1 }}
            transition={{ type: 'timing', duration: 220 }}
          >
            <LinearGradient
              colors={
                listening ? (['#FF9F0A', '#FF375F'] as const) : (['#0A84FF', '#5E5CE6'] as const)
              }
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: listening ? '#FF375F' : '#0A84FF',
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.55,
                shadowRadius: 36,
                elevation: 18,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  right: 8,
                  bottom: 8,
                  borderRadius: (size - 16) / 2,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.20)',
                }}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)'] as const}
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 10,
                  right: 10,
                  height: inner / 2,
                  borderTopLeftRadius: inner / 2,
                  borderTopRightRadius: inner / 2,
                }}
              />
              <Ionicons
                name={listening ? 'sync' : 'sparkles'}
                size={Math.round(size * 0.42)}
                color="#fff"
              />
            </LinearGradient>
          </MotiView>
        </View>
      )}
    </Pressable>
  );
};
