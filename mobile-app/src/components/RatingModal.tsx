/**
 * Rating modal — collects post-completion rating, review, and tags.
 * Submits to /api/bookings/feedback and updates provider rating.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../state/AppContext';
import { radii, spacing } from '../theme/colors';
import { submitFeedback } from '../services/api';

const TAGS = [
  { id: 'on_time', label_en: 'On time', label_ur: 'Time pe', icon: 'time' as const },
  { id: 'professional', label_en: 'Professional', label_ur: 'Professional', icon: 'briefcase' as const },
  { id: 'fair_price', label_en: 'Fair price', label_ur: 'Fair price', icon: 'cash' as const },
  { id: 'clean_work', label_en: 'Clean work', label_ur: 'Saaf kaam', icon: 'sparkles' as const },
  { id: 'polite', label_en: 'Polite', label_ur: 'Tameezdar', icon: 'happy' as const },
  { id: 'will_book_again', label_en: 'Will book again', label_ur: 'Phir book karunga', icon: 'heart' as const },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  providerName: string;
  onSubmitted?: (result: any) => void;
};

export const RatingModal = ({ visible, onClose, bookingId, providerName, onSubmitted }: Props) => {
  const { lang, colors, theme } = useApp();
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submitFeedback({
        booking_id: bookingId,
        rating: stars,
        review,
        tags: selectedTags,
      });
      onSubmitted?.(result);
      onClose();
    } catch (e) {
      // swallow — error UI minimal in modal context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Pressable onPress={() => {}} style={{ alignSelf: 'center', width: '100%', maxWidth: 460 }}>
          <MotiView
            from={{ opacity: 0, translateY: 30, scale: 0.94 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 16 }}
            style={{
              backgroundColor: colors.bg.surfaceSolid,
              borderRadius: radii.xl,
              padding: spacing.xl,
              borderWidth: theme === 'dark' ? 1 : 0,
              borderColor: colors.border.subtle,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <LinearGradient
                colors={['#FF9F0A', '#FF375F']}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                <Ionicons name="star" size={28} color="#fff" />
              </LinearGradient>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 19,
                  fontWeight: '800',
                  letterSpacing: -0.4,
                }}
              >
                {lang === 'ur' ? 'Service ko rate karein' : 'Rate this service'}
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: 12,
                  marginTop: 4,
                  textAlign: 'center',
                  paddingHorizontal: spacing.md,
                  lineHeight: 17,
                }}
              >
                {lang === 'ur'
                  ? `${providerName} ka kaam kaisa raha?`
                  : `How was ${providerName}'s service?`}
              </Text>
            </View>

            {/* Star picker */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
                marginVertical: spacing.md,
              }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setStars(n)} hitSlop={6}>
                  <Ionicons
                    name={n <= stars ? 'star' : 'star-outline'}
                    size={36}
                    color={n <= stars ? colors.ios.yellow : colors.text.tertiary}
                  />
                </Pressable>
              ))}
            </View>
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
                textAlign: 'center',
                marginBottom: spacing.md,
              }}
            >
              {stars} / 5 STARS
            </Text>

            {/* Tags */}
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              {lang === 'ur' ? 'KYA ACHA THA?' : 'WHAT WAS GOOD?'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}>
              {TAGS.map((t) => {
                const active = selectedTags.includes(t.id);
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => toggleTag(t.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? colors.brand.primary : colors.border.subtle,
                      backgroundColor: active ? colors.brand.primary + '15' : 'transparent',
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Ionicons
                      name={t.icon}
                      size={11}
                      color={active ? colors.brand.primary : colors.text.secondary}
                    />
                    <Text
                      style={{
                        color: active ? colors.brand.primary : colors.text.secondary,
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      {lang === 'ur' ? t.label_ur : t.label_en}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Review text */}
            <TextInput
              value={review}
              onChangeText={setReview}
              placeholder={
                lang === 'ur' ? 'Apna review likhein (optional)' : 'Write a review (optional)'
              }
              placeholderTextColor={colors.text.placeholder}
              multiline
              maxLength={300}
              style={{
                color: colors.text.primary,
                backgroundColor: colors.bg.elevated,
                borderRadius: radii.md,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 13,
                minHeight: 70,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                textAlignVertical: 'top',
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
              }}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => ({
                marginTop: spacing.md,
                paddingVertical: 14,
                borderRadius: 999,
                backgroundColor: colors.brand.primary,
                alignItems: 'center',
                opacity: submitting || pressed ? 0.75 : 1,
              })}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: -0.2 }}>
                  {lang === 'ur' ? 'Rating Submit Karein' : 'Submit Rating'}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={onClose}
              style={{ marginTop: 8, alignSelf: 'center', paddingVertical: 8 }}
            >
              <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
                {lang === 'ur' ? 'Skip' : 'Skip'}
              </Text>
            </Pressable>
          </MotiView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
