import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

export interface EmptyStateContainerProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyStateContainer({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateContainerProps) {
  return (
    <View className={`items-center justify-center py-12 px-6 bg-white border border-[#E5E7EB] rounded-standard ${className}`}>
      <View className="w-12 h-12 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] items-center justify-center mb-3">
        <Text className="text-xl text-[#9CA3AF]">∅</Text>
      </View>
      <Text className="text-base font-semibold text-[#111827] text-center mb-1">
        {title}
      </Text>
      <Text className="text-sm text-[#6B7280] text-center max-w-xs leading-relaxed mb-4">
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
        />
      )}
    </View>
  );
}
