import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface AIAssistantDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AIAssistantDrawer({ isVisible, onClose }: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const suggestedTopics = [
    'What are the timings for AskUs Kaksha?',
    'How do I log field attendance?',
    'Where are the active animal feeding spots?',
  ];

  async function handleSendMessage(queryText: string) {
    const query = queryText.trim();
    if (!query || isStreaming) return;

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `assistant_${Date.now()}`;

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', content: query },
      { id: assistantMessageId, role: 'assistant', content: '' },
    ]);
    setInputQuery('');
    setIsStreaming(true);

    try {
      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
      const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

      const response = await fetch(`${SUPABASE_URL}/functions/v1/askus-agent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback for runtimes without body stream reader
        const fullText = await response.text();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: fullText } : msg
          )
        );
        return;
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkString = decoder.decode(value, { stream: true });
        const lines = chunkString.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedText }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore partial chunk parse failures
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error('[AIAssistant] Query error:', err);
      const fallback =
        'Unable to connect with the AskUs Intelligence Agent. Please check network connectivity.';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, content: fallback } : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <View>
              <Text className="text-base font-semibold text-[#111827]">
                AskUs Foundation Guide
              </Text>
              <View className="flex-row items-center mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5" />
                <Text className="text-xs font-medium text-[#0F766E]">
                  Direct Operational Knowledge
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-semibold text-[#6B7280]">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Message Feed */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 py-4"
            contentContainerStyle={{ paddingBottom: 20 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Zero State / Suggested Topic Chips */}
            {messages.length === 0 && (
              <View className="py-6">
                <Text className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-3">
                  Suggested Foundation Questions
                </Text>
                <View className="space-y-2">
                  {suggestedTopics.map((topic, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSendMessage(topic)}
                      className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-standard active:bg-[#F0FDFA]"
                      activeOpacity={0.8}
                    >
                      <Text className="text-xs text-[#111827] font-medium">{topic}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Alternating Chat Bubbles */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={msg.id}
                  className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <View
                    className={`max-w-[82%] px-4 py-3 rounded-standard ${
                      isUser
                        ? 'bg-[#0F766E] rounded-br-none'
                        : 'bg-[#F9FAFB] border border-[#E5E7EB] rounded-bl-none'
                    }`}
                  >
                    {msg.content ? (
                      <Text
                        className={`text-sm leading-relaxed ${
                          isUser ? 'text-white' : 'text-[#111827]'
                        }`}
                      >
                        {msg.content}
                      </Text>
                    ) : (
                      <View className="flex-row items-center space-x-1.5 py-1">
                        <ActivityIndicator size="small" color="#0F766E" />
                        <Text className="text-xs text-[#6B7280]">Consulting foundation docs...</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Input Bar */}
          <View className="px-4 py-3 border-t border-[#E5E7EB] bg-white flex-row items-center space-x-2">
            <TextInput
              className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-standard px-3.5 py-2.5 text-sm text-[#111827]"
              value={inputQuery}
              onChangeText={setInputQuery}
              placeholder="Ask about centres, schedules, or SOPs..."
              placeholderTextColor="#9CA3AF"
              editable={!isStreaming}
              onSubmitEditing={() => handleSendMessage(inputQuery)}
            />
            <TouchableOpacity
              onPress={() => handleSendMessage(inputQuery)}
              disabled={!inputQuery.trim() || isStreaming}
              className={`px-4 py-2.5 rounded-standard items-center justify-center ${
                !inputQuery.trim() || isStreaming ? 'bg-gray-200' : 'bg-[#0F766E]'
              }`}
              activeOpacity={0.8}
            >
              <Text className="text-white text-xs font-semibold">Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
