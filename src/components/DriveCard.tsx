import React from 'react';
import { View, Text } from 'react-native';
import { Drive, FoundationWing } from '../types/database';
import { Button } from './Button';

export interface DriveCardProps {
  drive: Drive;
  userRegistrationStatus: 'registered' | 'none';
  onRsvp: (driveId: string) => void;
  isRsvping?: boolean;
  registeredCount?: number;
  className?: string;
}

export function DriveCard({
  drive,
  userRegistrationStatus,
  onRsvp,
  isRsvping = false,
  registeredCount = 0,
  className = '',
}: DriveCardProps) {
  // Wing Badge Styling Mapping
  const wingConfig: Record<FoundationWing, { label: string; badge: string }> = {
    askus_kaksha: {
      label: 'AskUs Kaksha',
      badge: 'bg-blue-50 text-[#2563EB] border-blue-200',
    },
    revolution_nari: {
      label: 'Revolution नारी',
      badge: 'bg-pink-50 text-[#DB2777] border-pink-200',
    },
    pawer_rangers: {
      label: 'Pawer Rangers',
      badge: 'bg-orange-50 text-[#EA580C] border-orange-200',
    },
    green_squad: {
      label: 'Green Squad',
      badge: 'bg-emerald-50 text-[#059669] border-emerald-200',
    },
  };

  const currentWing = wingConfig[drive.wing] ?? {
    label: drive.wing,
    badge: 'bg-gray-50 text-[#111827] border-gray-200',
  };

  // Compute live remaining capacity
  const slotsRemaining = Math.max(0, drive.capacity - registeredCount);
  const isFull = slotsRemaining === 0;
  const isRegistered = userRegistrationStatus === 'registered';

  function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <View className={`bg-white border border-[#E5E7EB] rounded-standard p-4 shadow-card ${className}`}>
      {/* Top Meta: Wing Badge & Remaining Slots */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className={`px-2.5 py-0.5 rounded-full border ${currentWing.badge}`}>
          <Text className="text-xs font-semibold tracking-tight">{currentWing.label}</Text>
        </View>
        <Text className={`text-xs font-medium ${isFull ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}>
          {isFull ? 'Drive Full' : `${slotsRemaining} slots remaining`}
        </Text>
      </View>

      {/* Drive Title */}
      <Text className="text-base font-semibold text-[#111827] leading-snug mb-1">
        {drive.title}
      </Text>

      {/* Description */}
      <Text className="text-sm text-[#6B7280] leading-relaxed mb-3" numberOfLines={2}>
        {drive.description}
      </Text>

      {/* Location & Time Pin */}
      <View className="py-2.5 border-t border-b border-[#E5E7EB] mb-3.5 space-y-1">
        <View className="flex-row items-center">
          <Text className="text-xs font-medium text-[#111827]">📍 {drive.location_name}</Text>
          <Text className="text-xs text-[#9CA3AF] ml-1.5">
            ({drive.latitude.toFixed(3)}, {drive.longitude.toFixed(3)})
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-xs text-[#6B7280]">
            🕒 {formatDate(drive.start_time)} – {new Date(drive.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {/* Action CTA */}
      <Button
        label={
          isRegistered
            ? 'Registered (Confirmed)'
            : isFull
            ? 'Capacity Reached'
            : 'RSVP to Drive'
        }
        onPress={() => onRsvp(drive.id)}
        variant={isRegistered ? 'secondary' : isFull ? 'ghost' : 'primary'}
        size="md"
        isLoading={isRsvping}
        disabled={isRegistered || isFull}
        className="w-full"
      />
    </View>
  );
}
