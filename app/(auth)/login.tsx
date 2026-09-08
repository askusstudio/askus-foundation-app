import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { sendOtp, verifyOtp } = useAuth();
  const router = useRouter();

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    try {
      setSubmitting(true);
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      await sendOtp(formattedPhone);
      setIsOtpSent(true);
    } catch (err: any) {
      Alert.alert('Failed to send OTP', err.message || 'Rate limit reached or invalid phone.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Validation Error', 'Please enter the 6-digit OTP code.');
      return;
    }
    try {
      setSubmitting(true);
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      await verifyOtp(formattedPhone, otp);
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid or expired OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-2xl font-inter font-semibold text-charcoal mb-2">
        {isOtpSent ? 'Enter Verification Code' : 'AskUs Foundation'}
      </Text>
      <Text className="text-sm font-inter text-slateMuted mb-6">
        {isOtpSent ? `Code sent to ${phone}` : 'Sign in or register with your mobile number'}
      </Text>

      {!isOtpSent ? (
        <>
          <TextInput
            className="w-full h-12 border border-gray-200 rounded-lg px-4 text-charcoal text-base mb-4 font-inter"
            keyboardType="phone-pad"
            maxLength={10}
            onChangeText={setPhone}
            placeholder="10-digit Mobile Number"
            placeholderTextColor="#9CA3AF"
            value={phone}
          />
          <TouchableOpacity
            className="w-full h-12 bg-primaryTeal rounded-lg items-center justify-center"
            disabled={submitting}
            onPress={handleSendOtp}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-inter font-medium">Send Code</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            className="w-full h-12 border border-gray-200 rounded-lg px-4 text-charcoal text-center text-lg tracking-widest mb-4 font-inter"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setOtp}
            placeholder="000000"
            placeholderTextColor="#9CA3AF"
            value={otp}
          />
          <TouchableOpacity
            className="w-full h-12 bg-primaryTeal rounded-lg items-center justify-center mb-3"
            disabled={submitting}
            onPress={handleVerifyOtp}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-inter font-medium">Verify & Proceed</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsOtpSent(false)}>
            <Text className="text-center text-slateMuted font-inter text-sm">
              Change mobile number
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
