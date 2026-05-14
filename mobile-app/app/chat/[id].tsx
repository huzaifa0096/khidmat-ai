/**
 * In-app chat between customer and provider for a specific booking.
 * Polls every 4s for new messages. Demo: customer side by default;
 * if mode === 'provider' it flips senders.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useApp } from '../../src/state/AppContext';
import { radii, spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { fetchMessages, sendMessage } from '../../src/services/api';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, colors, mode } = useApp();
  const me: 'customer' | 'provider' = mode === 'provider' ? 'provider' : 'customer';
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const load = async () => {
    if (!id) return;
    try {
      const data = await fetchMessages(id);
      setMessages(data.messages || []);
      setQuickReplies(data.quick_replies?.[me] || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length]);

  const handleSend = async (override?: string) => {
    const body = (override ?? text).trim();
    if (!body || !id) return;
    setSending(true);
    try {
      await sendMessage({ booking_id: id, sender: me, text: body });
      setText('');
      load();
    } catch {}
    setSending(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header
        title={lang === 'ur' ? 'Chat' : 'Chat'}
        subtitle={id}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            padding: spacing.lg,
            gap: 8,
            flexGrow: 1,
          }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
              <ActivityIndicator color={colors.brand.textAccent} />
            </View>
          ) : (
            messages.map((m, i) => {
              if (m.sender === 'system') {
                return (
                  <View key={m.id || i} style={{ alignItems: 'center', marginVertical: 4 }}>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: colors.bg.elevated,
                      }}
                    >
                      <Text style={{ color: colors.text.tertiary, fontSize: 11 }}>{m.text}</Text>
                    </View>
                  </View>
                );
              }
              const mine = m.sender === me;
              return (
                <MotiView
                  key={m.id || i}
                  from={{ opacity: 0, translateY: 4 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 200 }}
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '76%',
                    marginVertical: 2,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: mine ? colors.brand.primary : colors.bg.surfaceSolid,
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderWidth: mine ? 0 : 0.5,
                      borderColor: colors.border.divider,
                    }}
                  >
                    <Text
                      style={{
                        color: mine ? '#fff' : colors.text.primary,
                        fontSize: 15,
                        lineHeight: 20,
                        letterSpacing: -0.2,
                      }}
                    >
                      {m.text}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.text.quaternary,
                      fontSize: 10,
                      marginTop: 3,
                      alignSelf: mine ? 'flex-end' : 'flex-start',
                      paddingHorizontal: 8,
                    }}
                  >
                    {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </MotiView>
              );
            })
          )}
        </ScrollView>

        {/* Quick replies */}
        {quickReplies.length > 0 ? (
          <View style={{ height: 44, justifyContent: 'center' }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: spacing.md,
                gap: 6,
                alignItems: 'center',
              }}
              style={{ flexGrow: 0 }}
            >
              {quickReplies.map((q, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleSend(q)}
                  style={({ pressed }) => ({
                    height: 32,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    borderWidth: 0.5,
                    borderColor: colors.border.divider,
                    backgroundColor: colors.bg.elevated,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '400' }}>
                    {q}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
            backgroundColor: colors.bg.surfaceSolid,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={lang === 'ur' ? 'Message likhein...' : 'Type a message...'}
            placeholderTextColor={colors.text.placeholder}
            style={{
              flex: 1,
              color: colors.text.primary,
              backgroundColor: colors.bg.elevated,
              borderRadius: radii.pill,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 14,
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
            }}
            onSubmitEditing={() => handleSend()}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={sending || !text.trim()}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: text.trim() ? colors.brand.primary : colors.bg.elevated,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={18} color={text.trim() ? '#fff' : colors.text.tertiary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
