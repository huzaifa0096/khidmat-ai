/**
 * Service chip — theme-aware pill with icon + accent.
 */
import React from 'react';
import { Pressable, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../hooks/useTheme';

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  index?: number;
};

export const ServiceChip = ({ label, icon, color, onPress, index = 0 }: Props) => {
  const { colors, radii } = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 280, delay: index * 45 }}
    >
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <MotiView
            animate={{ scale: pressed ? 0.94 : 1 }}
            transition={{ type: 'timing', duration: 130 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.bg.surfaceSolid,
              paddingLeft: 6,
              paddingRight: 14,
              paddingVertical: 6,
              borderRadius: radii.pill,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              gap: 8,
              ...(Platform.OS === 'web'
                ? ({
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  } as any)
                : {}),
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: color + '24',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: color + '44',
              }}
            >
              <Ionicons name={icon} size={14} color={color} />
            </View>
            <Text
              style={{
                color: colors.text.primary,
                fontWeight: '600',
                fontSize: 13.5,
                letterSpacing: -0.2,
              }}
            >
              {label}
            </Text>
          </MotiView>
        )}
      </Pressable>
    </MotiView>
  );
};
