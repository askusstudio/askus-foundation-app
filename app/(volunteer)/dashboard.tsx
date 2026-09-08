import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MissionDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      {/* 1. Header Banner */}
      <View className="bg-primaryTeal px-5 pt-3 pb-6 rounded-b-[24px]">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-xl font-bold font-inter">AskUs Foundation</Text>
            <Text className="text-teal-100 text-xs font-inter mt-0.5">Ground Operations & Relief Portal</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            onPress={() => router.push('/(volunteer)' as any)}
          >
            <Ionicons color="#FFFFFF" name="notifications-outline" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 -mt-3" showsVerticalScrollIndicator={false}>
        {/* 2. Emergency / Urgent SOS Alert Strip */}
        <View className="bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center justify-between mb-4 shadow-sm">
          <View className="flex-row items-center flex-1">
            <Ionicons color="#DC2626" name="alert-circle" size={24} />
            <View className="ml-3 flex-1">
              <Text className="text-red-900 font-semibold text-xs font-inter">Pawer Rangers Rescue Call</Text>
              <Text className="text-red-700 text-[11px] font-inter">Report injured animal or SOS distress</Text>
            </View>
          </View>
          <TouchableOpacity
            className="bg-red-600 px-3 py-1.5 rounded-lg"
            onPress={() => router.push('/(supporter)' as any)}
          >
            <Text className="text-white text-xs font-bold font-inter">Report</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Section 1: AskUs Kaksha & Centers */}
        <Text className="text-charcoal font-semibold text-sm font-inter mb-2">Education & Centers (AskUs Kaksha)</Text>
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            className="flex-1 bg-[#E0F2FE] border border-[#BAE6FD] p-3 rounded-xl items-center"
            onPress={() => router.push('/(volunteer)' as any)}
          >
            <Ionicons color="#0369A1" name="location-outline" size={24} />
            <Text className="text-[#0369A1] font-semibold text-xs mt-2 text-center font-inter">Search Nearest Center</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-[#E0F2FE] border border-[#BAE6FD] p-3 rounded-xl items-center"
            onPress={() => router.push('/(volunteer)' as any)}
          >
            <Feather color="#0369A1" name="calendar" size={24} />
            <Text className="text-[#0369A1] font-semibold text-xs mt-2 text-center font-inter">Class Shifts</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Section 2: Revolution नारी & Support Wings */}
        <Text className="text-charcoal font-semibold text-sm font-inter mb-2">Empowerment & Self-Reliance</Text>
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            className="flex-1 bg-[#FFE4E6] border border-[#FECDD3] p-3 rounded-xl items-center"
            onPress={() => router.push('/(volunteer)' as any)}
          >
            <MaterialCommunityIcons color="#BE123C" name="hand-heart-outline" size={24} />
            <Text className="text-[#BE123C] font-semibold text-xs mt-2 text-center font-inter">Revolution नारी</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-[#FEF3C7] border border-[#FDE68A] p-3 rounded-xl items-center"
            onPress={() => router.push('/(volunteer)' as any)}
          >
            <MaterialCommunityIcons color="#B45309" name="paw-outline" size={24} />
            <Text className="text-[#B45309] font-semibold text-xs mt-2 text-center font-inter">Pawer Rangers</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Section 3: Verification & Operational Actions */}
        <Text className="text-charcoal font-semibold text-sm font-inter mb-2">Volunteer Portal</Text>
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            className="flex-1 bg-white border border-gray-200 p-3 rounded-xl items-center shadow-sm"
            onPress={() => router.push('/(volunteer)/kyc' as any)}
          >
            <Ionicons color="#0F766E" name="document-text-outline" size={22} />
            <Text className="text-charcoal font-semibold text-xs mt-1 text-center font-inter">Upload KYC Doc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white border border-gray-200 p-3 rounded-xl items-center shadow-sm"
            onPress={() => router.push('/(supporter)' as any)}
          >
            <Ionicons color="#0F766E" name="card-outline" size={22} />
            <Text className="text-charcoal font-semibold text-xs mt-1 text-center font-inter">Donate & 80G</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Direct Helpline Footnotes */}
        <View className="bg-white border border-gray-200 rounded-xl p-3 mb-6 shadow-sm">
          <Text className="text-xs font-semibold text-slateMuted font-inter mb-2">Important Helplines</Text>
          <View className="flex-row justify-between">
            <Text className="text-xs font-medium text-charcoal font-inter">Foundation HQ: +91 80000 00000</Text>
            <Text className="text-xs font-semibold text-primaryTeal font-inter">Call Now</Text>
          </View>
        </View>
      </ScrollView>

      {/* 7. Bottom Navigation Strip */}
      <View className="h-16 bg-white border-t border-gray-200 flex-row items-center justify-around px-4">
        <TouchableOpacity className="items-center">
          <Ionicons color="#0F766E" name="home" size={22} />
          <Text className="text-[11px] font-semibold text-primaryTeal font-inter mt-0.5">Home</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={() => router.push('/(volunteer)' as any)}>
          <MaterialCommunityIcons color="#6B7280" name="robot-outline" size={22} />
          <Text className="text-[11px] font-medium text-slateMuted font-inter mt-0.5">AskUs AI</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={() => router.push('/(volunteer)/kyc' as any)}>
          <Feather color="#6B7280" name="user" size={22} />
          <Text className="text-[11px] font-medium text-slateMuted font-inter mt-0.5">Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
