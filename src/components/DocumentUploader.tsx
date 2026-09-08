import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface SelectedDocument {
  name: string;
  uri: string;
  size: number;
  mimeType: string;
}

export interface DocumentUploaderProps {
  acceptedTypes?: string[];
  maxSizeMb?: number;
  onFileSelected: (file: SelectedDocument) => void;
  isUploading?: boolean;
  selectedFile?: SelectedDocument | null;
  onClear?: () => void;
  className?: string;
}

export function DocumentUploader({
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  maxSizeMb = 5,
  onFileSelected,
  isUploading = false,
  selectedFile = null,
  onClear,
  className = '',
}: DocumentUploaderProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handlePickDocument() {
    setErrorMsg(null);

    try {
      // Permission verification
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Storage permission is required to select identification documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileSize = asset.fileSize ?? 1024 * 1024; // Fallback estimate if null
      const maxSizeBytes = maxSizeMb * 1024 * 1024;

      // 1. Client-Side Size Enforcement
      if (fileSize > maxSizeBytes) {
        const error = `File size exceeds ${maxSizeMb} MB threshold.`;
        setErrorMsg(error);
        Alert.alert('Upload Error', error);
        return;
      }

      // 2. MIME Type Validation
      const mimeType = asset.mimeType ?? 'image/jpeg';
      if (!acceptedTypes.includes(mimeType)) {
        const error = 'Disallowed file format. Only JPEG, PNG, or PDF are accepted.';
        setErrorMsg(error);
        Alert.alert('Invalid Format', error);
        return;
      }

      const fileName = asset.fileName ?? `kyc_doc_${Date.now()}.${mimeType.includes('png') ? 'png' : 'jpg'}`;

      onFileSelected({
        name: fileName,
        uri: asset.uri,
        size: fileSize,
        mimeType,
      });
    } catch (e) {
      console.error('[DocumentUploader] Picker error:', e);
      setErrorMsg('Failed to open document selector.');
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <View className={`w-full ${className}`}>
      {selectedFile ? (
        // Preview State with File Details and Clear Option
        <View className="bg-white border border-[#E5E7EB] rounded-standard p-4 flex-row items-center justify-between shadow-card">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-semibold text-[#111827] truncate" numberOfLines={1}>
              {selectedFile.name}
            </Text>
            <Text className="text-xs text-[#6B7280] mt-0.5">
              Size: {formatBytes(selectedFile.size)} • Verified Format
            </Text>
          </View>
          {onClear && !isUploading && (
            <TouchableOpacity
              onPress={onClear}
              className="py-1.5 px-2.5 bg-gray-100 rounded-standard"
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-[#DC2626]">Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Tap-to-select / Drop Area
        <TouchableOpacity
          onPress={handlePickDocument}
          disabled={isUploading}
          activeOpacity={0.8}
          className="border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] rounded-standard p-6 items-center justify-center"
        >
          <View className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] items-center justify-center mb-2">
            <Text className="text-[#0F766E] text-lg font-bold">↑</Text>
          </View>
          <Text className="text-sm font-semibold text-[#111827]">
            {isUploading ? 'Preparing upload...' : 'Tap to select document'}
          </Text>
          <Text className="text-xs text-[#6B7280] mt-1 text-center">
            Supports JPEG, PNG, PDF (Max {maxSizeMb} MB)
          </Text>
        </TouchableOpacity>
      )}

      {errorMsg && (
        <Text className="text-xs text-[#DC2626] font-medium mt-1.5">{errorMsg}</Text>
      )}
    </View>
  );
}
