import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { Button } from '../../src/components/Button';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  // 6 segmented digit inputs
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // Locked 60-second countdown timer for resend
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleDigitChange(text: string, index: number) {
    const cleanDigit = text.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  const fullOtp = digits.join('');
  const isOtpComplete = fullOtp.length === 6;

  async function handleVerify() {
    if (!isOtpComplete) return;

    if (!phone) {
      Alert.alert('Session Error', 'Missing phone context. Please restart login.');
      router.replace('/(auth)/login');
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: fullOtp,
        type: 'sms',
      });

      if (error) {
        Alert.alert('Verification Failed', error.message);
        return;
      }

      if (data.session) {
        // Successful verification; redirect to root role router
        router.replace('/');
      }
    } catch (e) {
      Alert.alert('Error', 'Verification gateway offline. Please retry.');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!canResend || !phone) return;
    setCanResend(false);
    setCountdown(60);

    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        Alert.alert('Resend Failed', error.message);
      } else {
        Alert.alert('Code Dispatched', 'A new 6-digit OTP has been sent via SMS.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to resend OTP.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6">
        <View className="mb-8">
          <Text className="text-2xl font-semibold text-[#111827] tracking-tight">
            Confirm Verification Code
          </Text>
          <Text className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
            Enter the 6-digit code dispatched to{' '}
            <Text className="font-semibold text-[#111827]">{phone}</Text>
          </Text>
        </View>

        {/* 6-Box Segmented OTP Inputs */}
        <View className="flex-row justify-between mb-6">
          {digits.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => (inputRefs.current[idx] = ref)}
              className={`w-12 h-14 border rounded-standard text-center text-xl font-semibold text-[#111827] bg-[#F9FAFB] ${
                digit ? 'border-[#0F766E] bg-white' : 'border-[#E5E7EB]'
              }`}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={idx === 0}
              editable={!isVerifying}
            />
          ))}
        </View>

        {/* Primary Verify Action */}
        <Button
          label="Verify & Sign In"
          onPress={handleVerify}
          variant="primary"
          size="lg"
          isLoading={isVerifying}
          disabled={!isOtpComplete || isVerifying}
          className="mb-4"
        />

        {/* Resend OTP Timer */}
        <View className="items-center mt-2">
          {canResend ? (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <Text className="text-sm font-semibold text-[#0F766E]">
                Resend Verification Code
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-xs text-[#6B7280]">
              Resend code in{' '}
              <Text className="font-semibold text-[#111827]">{countdown}s</Text>
            </Text>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 py-2"
            activeOpacity={0.7}
          >
            <Text className="text-xs text-[#6B7280]">
              Entered incorrect number? <Text className="text-[#0F766E] font-medium">Change</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
