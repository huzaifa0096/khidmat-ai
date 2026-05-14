/**
 * Chat History — all conversations (bookings with chat threads) for the active user
 * or provider. Used by both customer mode (shows providers) and provider mode (shows
 * customers). Tap a row to open /chat/[bookingId].
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { fetchChatThreads } from '../src/services/api';

type Thread = {
  booking_id: string;
  status: string;
  counterparty_name: string;
  counterparty_avatar?: string;
  service_name: string;
  scheduled_for: string;
  last_message: string;
  last_sender: string;
  last_ts: string;
  unread_count: number;
};

export default function ChatsScreen() {
  const router = useRouter();
  const { lang, colors, user, mode } = useApp();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const params =
        mode === 'provider'
          ? { provider_id: user.provider?.provider_id }
          : { user_id: user.id };
      const data = await fetchChatThreads(params);
      setThreads(data?.threads || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [user.id, user.provider?.provider_id, mode]);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const formatWhen = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const days = Math.round((now.getTime() - d.getTime()) / 86400000);
      if (days < 7) return `${days}d`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header
        title={lang === 'ur' ? 'Chats' : 'Messages'}
        subtitle={
          mode === 'provider'
            ? lang === 'ur'
              ? 'Apne customers se rabta'
              : 'Talk to your customers'
            : lang === 'ur'
            ? 'Apne service providers se rabta'
            : 'Talk to your service providers'
        }
      />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand.textAccent} />
        </View>
      ) : threads.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="chatbubbles-outline" size={56} color={colors.text.tertiary} />
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 17,
              fontWeight: '700',
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            {lang === 'ur' ? 'Abhi koi chat nahi' : 'No conversations yet'}
          </Text>
          <Text
            style={{
              color: colors.text.tertiary,
              fontSize: 13,
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 19,
            }}
          >
            {mode === 'provider'
              ? lang === 'ur'
                ? 'Job accept karein, customer se chat shuru ho jayegi.'
                : 'Accept a job to start chatting with customers.'
              : lang === 'ur'
              ? 'Service book karein, provider se chat shuru ho jayegi.'
              : 'Book a service to start chatting with providers.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(t) => t.booking_id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.textAccent} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const isUnread = item.unread_count > 0;
            return (
              <Pressable
                onPress={() => router.push(`/chat/${item.booking_id}`)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: spacing.md,
                  backgroundColor: colors.bg.surfaceSolid,
                  borderRadius: radii.lg,
                  borderWidth: 0.5,
                  borderColor: colors.border.divider,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {/* Avatar */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.bg.elevated,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {item.counterparty_avatar ? (
                    <Image
                      source={{ uri: item.counterparty_avatar }}
                      style={{ width: 48, height: 48 }}
                    />
                  ) : (
                    <Ionicons
                      name={mode === 'provider' ? 'person' : 'briefcase'}
                      size={22}
                      color={colors.brand.textAccent}
                    />
                  )}
                </View>
                {/* Text */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        color: colors.text.primary,
                        fontSize: 15,
                        fontWeight: '700',
                        flex: 1,
                        marginRight: 8,
                      }}
                    >
                      {item.counterparty_name}
                    </Text>
                    <Text style={{ color: colors.text.tertiary, fontSize: 11 }}>
                      {formatWhen(item.last_ts)}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.text.tertiary,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {item.service_name} · {item.status.replace(/_/g, ' ')}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 4,
                      gap: 6,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        color: isUnread ? colors.text.primary : colors.text.secondary,
                        fontSize: 13,
                        fontWeight: isUnread ? '600' : '400',
                        flex: 1,
                      }}
                    >
                      {item.last_sender === 'system'
                        ? `· ${item.last_message}`
                        : item.last_message}
                    </Text>
                    {isUnread ? (
                      <View
                        style={{
                          minWidth: 20,
                          height: 20,
                          paddingHorizontal: 6,
                          borderRadius: 10,
                          backgroundColor: colors.brand.textAccent,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                          {item.unread_count}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
