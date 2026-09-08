import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/services/supabase';
import { EmptyStateContainer } from '../../src/components/EmptyStateContainer';
import { Button } from '../../src/components/Button';
import { ThreatSeverity } from '../../src/types/database';

interface KycQueueItem {
  id: string;
  user_id: string;
  document_type: string;
  file_path: string;
  submitted_at: string;
  profiles: {
    full_name: string | null;
    phone: string;
  } | null;
}

interface ThreatLogItem {
  id: string;
  ip_address: string;
  endpoint: string;
  threat_type: string;
  severity: ThreatSeverity;
  created_at: string;
  metadata: Record<string, unknown>;
}

export default function AdminConsoleScreen() {
  const [activeTab, setActiveTab] = useState<'kyc' | 'threats'>('kyc');
  const [kycQueue, setKycQueue] = useState<KycQueueItem[]>([]);
  const [threatLogs, setThreatLogs] = useState<ThreatLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadAdminData() {
    setIsLoading(true);
    try {
      if (activeTab === 'kyc') {
        // Fetch pending records from public.volunteer_kyc joining public.profiles
        const { data, error } = await supabase
          .from('volunteer_kyc')
          .select(`
            id,
            user_id,
            document_type,
            file_path,
            submitted_at,
            profiles (
              full_name,
              phone
            )
          `)
          .is('reviewed_at', null)
          .order('submitted_at', { ascending: true });

        if (error) throw error;
        setKycQueue((data as unknown as KycQueueItem[]) ?? []);
      } else {
        // Fetch threat incidents from public.threat_logs
        const { data, error } = await supabase
          .from('threat_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;
        setThreatLogs((data as ThreatLogItem[]) ?? []);
      }
    } catch (e) {
      console.error('[Admin Console] Data fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  async function handleKycReview(item: KycQueueItem, action: 'approve' | 'reject') {
    const reason = action === 'reject' ? 'Document image unreadable or expired ID.' : null;
    setProcessingId(item.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Update volunteer_kyc record
      const { error: kycError } = await supabase
        .from('volunteer_kyc')
        .update({
          reviewed_at: new Date().toISOString(),
          verified_by: session.user.id,
          rejection_reason: reason,
        })
        .eq('id', item.id);

      if (kycError) throw kycError;

      // 2. Update profiles kyc_status & role
      const newStatus = action === 'approve' ? 'verified' : 'rejected';
      const newRole = action === 'approve' ? 'volunteer' : 'supporter';

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          kyc_status: newStatus,
          role: newRole,
        })
        .eq('id', item.user_id);

      if (profileError) throw profileError;

      Alert.alert('Decision Recorded', `Volunteer KYC has been ${action === 'approve' ? 'Approved' : 'Rejected'}.`);
      await loadAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Review action failed';
      Alert.alert('Review Error', msg);
    } finally {
      setProcessingId(null);
    }
  }

  const severityBadgeColors: Record<ThreatSeverity, { bg: string; text: string; border: string }> = {
    critical: { bg: 'bg-red-50', text: 'text-[#DC2626]', border: 'border-red-200' },
    high: { bg: 'bg-orange-50', text: 'text-[#EA580C]', border: 'border-orange-200' },
    medium: { bg: 'bg-amber-50', text: 'text-[#D97706]', border: 'border-amber-200' },
    low: { bg: 'bg-gray-50', text: 'text-[#6B7280]', border: 'border-gray-200' },
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="px-5 py-4 bg-white border-b border-[#E5E7EB]">
        <Text className="text-xl font-semibold text-[#111827]">
          Operations Governance
        </Text>
        <Text className="text-xs text-[#6B7280] mt-0.5">
          AskUs Foundation Administrative & Security Console
        </Text>

        {/* Tab Switcher */}
        <View className="flex-row bg-[#F9FAFB] p-1 border border-[#E5E7EB] rounded-standard mt-3.5">
          <TouchableOpacity
            onPress={() => setActiveTab('kyc')}
            className={`flex-1 py-1.5 items-center rounded-md ${
              activeTab === 'kyc' ? 'bg-white shadow-card border border-[#E5E7EB]' : ''
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === 'kyc' ? 'text-[#0F766E]' : 'text-[#6B7280]'
              }`}
            >
              KYC Verification Queue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('threats')}
            className={`flex-1 py-1.5 items-center rounded-md ${
              activeTab === 'threats' ? 'bg-white shadow-card border border-[#E5E7EB]' : ''
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === 'threats' ? 'text-[#0F766E]' : 'text-[#6B7280]'
              }`}
            >
              Watchdog Threat Monitor
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#0F766E" />
            <Text className="text-xs text-[#6B7280] mt-3">Loading operational data...</Text>
          </View>
        ) : activeTab === 'kyc' ? (
          /* Module A: KYC Verification Queue */
          kycQueue.length === 0 ? (
            <EmptyStateContainer
              title="Zero Pending Verifications"
              description="Zero pending verifications. All volunteer documents reviewed."
              actionLabel="Refresh Queue"
              onAction={loadAdminData}
            />
          ) : (
            <View className="space-y-3">
              {kycQueue.map((item) => (
                <View
                  key={item.id}
                  className="bg-white border border-[#E5E7EB] rounded-standard p-4 shadow-card"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="text-sm font-semibold text-[#111827]">
                        {item.profiles?.full_name ?? 'Volunteer Submitter'}
                      </Text>
                      <Text className="text-xs text-[#6B7280]">
                        Phone: {item.profiles?.phone ?? 'N/A'}
                      </Text>
                    </View>
                    <View className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full">
                      <Text className="text-xs font-semibold text-[#111827] uppercase">
                        {item.document_type}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs text-[#6B7280] mb-3">
                    Submitted: {new Date(item.submitted_at).toLocaleString('en-IN')}
                  </Text>

                  <View className="flex-row space-x-2 pt-2 border-t border-[#E5E7EB]">
                    <Button
                      label="Approve"
                      onPress={() => handleKycReview(item, 'approve')}
                      variant="primary"
                      size="sm"
                      isLoading={processingId === item.id}
                      className="flex-1"
                    />
                    <Button
                      label="Reject with Reason"
                      onPress={() => handleKycReview(item, 'reject')}
                      variant="danger"
                      size="sm"
                      isLoading={processingId === item.id}
                      className="flex-1"
                    />
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          /* Module B: Threat & Bug Incident Monitor */
          threatLogs.length === 0 ? (
            <EmptyStateContainer
              title="Perimeter Healthy"
              description="System status healthy. No anomalies or security alerts detected."
              actionLabel="Poll Logs"
              onAction={loadAdminData}
            />
          ) : (
            <View className="space-y-3">
              {threatLogs.map((log) => {
                const badge = severityBadgeColors[log.severity] ?? severityBadgeColors.medium;
                return (
                  <View
                    key={log.id}
                    className="bg-white border border-[#E5E7EB] rounded-standard p-4 shadow-card"
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <View className={`px-2 py-0.5 rounded-full border ${badge.bg} ${badge.border}`}>
                        <Text className={`text-xs font-bold uppercase tracking-wider ${badge.text}`}>
                          {log.severity}
                        </Text>
                      </View>
                      <Text className="text-xs text-[#6B7280]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </Text>
                    </View>

                    <Text className="text-sm font-semibold text-[#111827]">
                      {log.threat_type}
                    </Text>
                    <Text className="text-xs text-[#6B7280] mt-0.5">
                      Endpoint: {log.endpoint} • Client IP: {log.ip_address}
                    </Text>
                  </View>
                );
              })}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
