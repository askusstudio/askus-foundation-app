import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { Drive, FoundationWing } from '../../src/types/database';
import { DriveCard } from '../../src/components/DriveCard';
import { EmptyStateContainer } from '../../src/components/EmptyStateContainer';

type WingFilter = 'all' | FoundationWing;

export default function VolunteerDrivesHubScreen() {
  const router = useRouter();
  const [selectedWing, setSelectedWing] = useState<WingFilter>('all');
  const [drives, setDrives] = useState<Drive[]>([]);
  const [registeredDriveIds, setRegisteredDriveIds] = useState<Set<string>>(new Set());
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [rsvpingDriveId, setRsvpingDriveId] = useState<string | null>(null);

  // Fetch real drives and user registrations from Supabase
  async function loadDrivesData() {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // 1. Fetch published/upcoming drives from public.drives
      let query = supabase
        .from('drives')
        .select('*')
        .in('status', ['upcoming', 'in_progress'])
        .order('start_time', { ascending: true });

      if (selectedWing !== 'all') {
        query = query.eq('wing', selectedWing);
      }

      const { data: driveList, error: drivesError } = await query;
      if (drivesError) throw drivesError;

      const currentDrives = (driveList as Drive[]) ?? [];
      setDrives(currentDrives);

      // 2. Fetch attendee counts and user registration status if session exists
      if (session && currentDrives.length > 0) {
        const driveIds = currentDrives.map((d) => d.id);

        const { data: attendees } = await supabase
          .from('drive_attendees')
          .select('drive_id, user_id')
          .in('drive_id', driveIds);

        const userRegs = new Set<string>();
        const counts: Record<string, number> = {};

        (attendees ?? []).forEach((row: { drive_id: string; user_id: string }) => {
          counts[row.drive_id] = (counts[row.drive_id] ?? 0) + 1;
          if (row.user_id === session.user.id) {
            userRegs.add(row.drive_id);
          }
        });

        setRegisteredDriveIds(userRegs);
        setAttendeeCounts(counts);
      }
    } catch (e) {
      console.error('[Drives Hub] Failed loading drives:', e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDrivesData();
  }, [selectedWing]);

  async function handleRsvp(driveId: string) {
    setRsvpingDriveId(driveId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Authentication Required', 'Please sign in to RSVP for drives.');
        return;
      }

      // Check KYC status before allowing RSVP
      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', session.user.id)
        .single();

      if (profile?.kyc_status !== 'verified') {
        Alert.alert(
          'Verification Required',
          'Field shift RSVPs are restricted to verified volunteers. Please complete identity verification.',
          [
            { text: 'Verify Identity', onPress: () => router.push('/(volunteer)/kyc') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Insert attendee record into public.drive_attendees
      const { error: rsvpError } = await supabase
        .from('drive_attendees')
        .insert({
          drive_id: driveId,
          user_id: session.user.id,
          status: 'registered',
        });

      if (rsvpError) throw rsvpError;

      Alert.alert('RSVP Confirmed', 'Your spot has been registered for this drive.');
      await loadDrivesData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'RSVP submission failed';
      Alert.alert('RSVP Error', msg);
    } finally {
      setRsvpingDriveId(null);
    }
  }

  const filterChips: Array<{ id: WingFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'askus_kaksha', label: 'AskUs Kaksha' },
    { id: 'revolution_nari', label: 'Revolution नारी' },
    { id: 'pawer_rangers', label: 'Pawer Rangers' },
    { id: 'green_squad', label: 'Green Squad' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <ScrollView className="flex-1 px-4 py-5" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header Bar */}
        <View className="flex-row justify-between items-center mb-5">
          <View>
            <Text className="text-2xl font-semibold text-[#111827] tracking-tight">
              Field Operations
            </Text>
            <Text className="text-xs text-[#6B7280] mt-0.5">
              Verified volunteer initiatives & community relief
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(volunteer)/kyc')}
            className="py-1.5 px-3 bg-white border border-[#E5E7EB] rounded-standard shadow-card"
          >
            <Text className="text-xs font-semibold text-[#0F766E]">KYC Status</Text>
          </TouchableOpacity>
        </View>

        {/* Wing Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row mb-5 pb-1"
        >
          {filterChips.map((chip) => (
            <TouchableOpacity
              key={chip.id}
              onPress={() => setSelectedWing(chip.id)}
              className={`mr-2.5 py-1.5 px-3.5 rounded-full border ${
                selectedWing === chip.id
                  ? 'bg-[#0F766E] border-[#0F766E]'
                  : 'bg-white border-[#E5E7EB]'
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedWing === chip.id ? 'text-white' : 'text-[#6B7280]'
                }`}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Drives Dynamic List / Zero Data Empty State */}
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#0F766E" />
            <Text className="text-xs text-[#6B7280] mt-3">Fetching scheduled drives...</Text>
          </View>
        ) : drives.length === 0 ? (
          <EmptyStateContainer
            title="No Active Drives"
            description="No active field drives scheduled in this area. Check back soon for upcoming community initiatives."
            actionLabel="Refresh Feed"
            onAction={loadDrivesData}
          />
        ) : (
          <View className="space-y-4">
            {drives.map((drive) => (
              <DriveCard
                key={drive.id}
                drive={drive}
                userRegistrationStatus={
                  registeredDriveIds.has(drive.id) ? 'registered' : 'none'
                }
                registeredCount={attendeeCounts[drive.id] ?? 0}
                onRsvp={handleRsvp}
                isRsvping={rsvpingDriveId === drive.id}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
