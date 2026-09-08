import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  // Visual Token Variant Mappings
  const variantStyles: Record<ButtonVariant, { container: string; text: string; spinner: string }> = {
    primary: {
      container: 'bg-[#0F766E] border border-[#0F766E] active:bg-[#14B8A6]',
      text: 'text-white',
      spinner: '#FFFFFF',
    },
    secondary: {
      container: 'bg-white border border-[#E5E7EB] active:bg-[#F9FAFB]',
      text: 'text-[#111827]',
      spinner: '#111827',
    },
    danger: {
      container: 'bg-[#DC2626] border border-[#DC2626] active:bg-red-700',
      text: 'text-white',
      spinner: '#FFFFFF',
    },
    ghost: {
      container: 'bg-transparent active:bg-gray-100',
      text: 'text-[#0F766E]',
      spinner: '#0F766E',
    },
  };

  const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
    sm: { container: 'py-2 px-3', text: 'text-xs' },
    md: { container: 'py-2.5 px-4', text: 'text-sm' },
    lg: { container: 'py-3.5 px-5', text: 'text-base' },
  };

  const isInteractive = !disabled && !isLoading;

  return (
    <TouchableOpacity
      className={`rounded-standard flex-row items-center justify-center ${variantStyles[variant].container} ${sizeStyles[size].container} ${
        !isInteractive ? 'opacity-50' : 'shadow-card'
      } ${className}`}
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variantStyles[variant].spinner} />
      ) : (
        <Text className={`font-semibold tracking-tight ${variantStyles[variant].text} ${sizeStyles[size].text}`}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
