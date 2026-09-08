import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { DriveRsvpSchema, GeoCheckInSchema } from '@/utils/validators';
import { getLocalCache, setLocalCache } from '@/utils/cache';

export interface Drive {
  id: string;
  title: string;
  description: string;
  wing: 'askus_kaksha' | 'revolution_nari' | 'pawer_rangers' | 'green_squad';
  location_name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  coordinator_id: string;
}

const DRIVES_CACHE_KEY = 'upcoming_drives_list';

export const useDrives = (userId?: string) => {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [registeredDriveIds, setRegisteredDriveIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchDrives = async () => {
    setLoading(true);

    // Gate 7: Offline-first data cache resilience
    try {
      const cached = await getLocalCache<Drive[]>(DRIVES_CACHE_KEY);
      if (cached && cached.length > 0) {
        setDrives(cached);
      }
    } catch {
      // Continue to network fetch
    }

    try {
      const { data: driveData, error: driveError } = await supabase
        .from('drives')
        .select('*')
        .order('start_time', { ascending: true });

      if (!driveError && driveData) {
        setDrives(driveData as Drive[]);
        // Save to offline storage with 60 min TTL
        await setLocalCache(DRIVES_CACHE_KEY, driveData as Drive[], 60);
      }
    } catch {
      // Offline fallback: keep cached data active
    }

    if (userId) {
      try {
        const { data: attendanceData } = await supabase
          .from('drive_attendees')
          .select('drive_id')
          .eq('user_id', userId);

        if (attendanceData) {
          setRegisteredDriveIds(
            new Set(attendanceData.map((a: { drive_id: string }) => a.drive_id))
          );
        }
      } catch {
        // Suppress offline failure for attendee badges
      }
    }

    setLoading(false);
  };

  const rsvpToDrive = async (driveId: string) => {
    if (!userId) throw new Error('User not authenticated');

    // Gate 7: Strict input sanitization before dispatch
    const validated = DriveRsvpSchema.parse({ driveId, userId });

    const { error } = await supabase.from('drive_attendees').insert({
      drive_id: validated.driveId,
      user_id: validated.userId,
      status: 'registered',
    });

    if (error) throw error;
    setRegisteredDriveIds((prev) => new Set(prev).add(driveId));
  };

  const checkInAttendance = async (driveId: string, lat: number, long: number) => {
    if (!userId) throw new Error('User not authenticated');

    // Gate 7: Strict input sanitization before dispatch
    const validated = GeoCheckInSchema.parse({
      driveId,
      userId,
      latitude: lat,
      longitude: long,
    });

    const { error } = await supabase
      .from('drive_attendees')
      .update({
        status: 'attended',
        check_in_time: new Date().toISOString(),
        check_in_lat: validated.latitude,
        check_in_long: validated.longitude,
      })
      .match({ drive_id: validated.driveId, user_id: validated.userId });

    if (error) throw error;
  };

  useEffect(() => {
    fetchDrives();
  }, [userId]);

  return {
    drives,
    registeredDriveIds,
    loading,
    rsvpToDrive,
    checkInAttendance,
    refresh: fetchDrives,
  };
};
