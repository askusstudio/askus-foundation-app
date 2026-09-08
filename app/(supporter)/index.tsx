import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { AIAssistantDrawer } from '../../src/components/AIAssistantDrawer';

const WINGS = [
  {
    id: 'askus_kaksha',
    name: 'AskUs Kaksha / EmpowerEd',
    badge: 'Education',
    desc: 'Foundational literacy, numeracy, and student mentorship across community centres.',
    color: 'border-l-[#2563EB]',
    badgeStyle: 'bg-blue-50 text-[#2563EB]',
  },
  {
    id: 'revolution_nari',
    name: 'Revolution नारी',
    badge: 'Women Empowerment',
    desc: 'Menstrual health awareness, hygiene kit distribution, and vocational training.',
    color: 'border-l-[#DB2777]',
    badgeStyle: 'bg-pink-50 text-[#DB2777]',
  },
  {
    id: 'pawer_rangers',
    name: 'Pawer Rangers',
    badge: 'Animal Welfare',
    desc: 'Stray animal rescue triage, vaccination drives, and humane feeding networks.',
    color: 'border-l-[#EA580C]',
    badgeStyle: 'bg-orange-50 text-[#EA580C]',
  },
  {
    id: 'green_squad',
    name: 'Green Squad',
    badge: 'Environment',
    desc: 'Native urban afforestation, seed-bombing, cleanup campaigns, and climate action.',
    color: 'border-l-[#059669]',
    badgeStyle: 'bg-emerald-50 text-[#059669]',
  },
];

export default function SupporterHomeScreen() {
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <ScrollView className="flex-1 px-4 py-5" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Foundation Hero Card */}
        <View className="mb-6 bg-[#0F766E] rounded-standard p-5 shadow-card">
          <Text className="text-white text-xl font-semibold tracking-tight">
            AskUs Foundation
          </Text>
          <Text className="text-emerald-100 text-xs mt-1 leading-relaxed">
            Community mobilization and verified field impact across four operational wings.
          </Text>

          <View className="flex-row mt-4 space-x-3">
            <TouchableOpacity
              className="bg-white rounded-standard px-3.5 py-2 shadow-card"
              activeOpacity={0.8}
            >
              <Text className="text-[#0F766E] font-semibold text-xs">
                Contribute (80G Tax Rebate)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#DC2626] rounded-standard px-3.5 py-2 shadow-card"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-xs">
                Report SOS Distress
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Global AI Assistant Trigger Card */}
        <TouchableOpacity
          className="bg-white border border-[#0F766E]/30 rounded-standard p-4 mb-6 shadow-card flex-row items-center justify-between"
          onPress={() => setIsAiDrawerOpen(true)}
          activeOpacity={0.8}
        >
          <View className="flex-1 pr-3">
            <View className="flex-row items-center mb-1">
              <Text className="text-sm font-semibold text-[#111827]">
                AskUs Intelligence Assistant
              </Text>
              <View className="ml-2 w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            </View>
            <Text className="text-xs text-[#6B7280]">
              Get grounded answers on centres, SOPs, donation tax exemptions, and schedules.
            </Text>
          </View>
          <View className="w-8 h-8 rounded-full bg-[#F0FDFA] border border-[#0F766E]/20 items-center justify-center">
            <Text className="text-[#0F766E] font-bold text-sm">→</Text>
          </View>
        </TouchableOpacity>

        {/* Wings List */}
        <Text className="text-base font-semibold text-[#111827] mb-3">
          Foundation Operational Wings
        </Text>

        <View className="space-y-3">
          {WINGS.map((wing) => (
            <View
              key={wing.id}
              className={`bg-white rounded-standard p-4 border border-[#E5E7EB] border-l-4 shadow-card ${wing.color}`}
            >
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-base font-semibold text-[#111827]">
                  {wing.name}
                </Text>
                <View className={`px-2 py-0.5 rounded-full ${wing.badgeStyle}`}>
                  <Text className="text-[10px] font-semibold tracking-wide uppercase">
                    {wing.badge}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-[#6B7280] leading-relaxed">
                {wing.desc}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Global Real-time AI Assistant Drawer */}
      <AIAssistantDrawer
        isVisible={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />
    </SafeAreaView>
  );
}
