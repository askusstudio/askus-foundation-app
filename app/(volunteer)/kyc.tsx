import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/services/supabase';
import { DocumentUploader, SelectedDocument } from '../../src/components/DocumentUploader';
import { Button } from '../../src/components/Button';
import { EmptyStateContainer } from '../../src/components/EmptyStateContainer';
import { KycStatus, VolunteerKyc } from '../../src/types/database';

type DocumentType = 'aadhaar' | 'student_id' | 'pan';

export default function KycVerificationScreen() {
  const [kycStatus, setKycStatus] = useState<KycStatus>('not_submitted');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('aadhaar');
  const [selectedFile, setSelectedFile] = useState<SelectedDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingRecord, setExistingRecord] = useState<VolunteerKyc | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real current KYC status and document from Supabase
  async function loadKycState() {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Fetch profile kyc_status
      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setKycStatus(profile.kyc_status as KycStatus);
      }

      // 2. Fetch latest volunteer_kyc record
      const { data: kycDoc } = await supabase
        .from('volunteer_kyc')
        .select('*')
        .eq('user_id', session.user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (kycDoc) {
        setExistingRecord(kycDoc as VolunteerKyc);
      }
    } catch (e) {
      console.error('[KYC Screen] Error loading status:', e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadKycState();
  }, []);

  async function handleSubmitKyc() {
    if (!selectedFile) {
      Alert.alert('File Required', 'Please select an identification document before submitting.');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthenticated session');

      const fileExtension = (selectedFile.name.split('.').pop()?.toLowerCase() ?? 'jpg') as 'jpg' | 'png' | 'pdf';

      // 1. Request signed PUT URL from Edge Function
      const { data: uploadUrlData, error: edgeError } = await supabase.functions.invoke('get-kyc-upload-url', {
        body: {
          documentType: selectedDocType,
          fileExtension: ['jpg', 'png', 'pdf'].includes(fileExtension) ? fileExtension : 'jpg',
        },
      });

      if (edgeError || !uploadUrlData?.signedUrl) {
        throw new Error(edgeError?.message ?? 'Failed to issue upload authorization');
      }

      // 2. Direct binary/blob upload to Supabase Storage via signed PUT URL
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();

      const putRes = await fetch(uploadUrlData.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.mimeType,
        },
        body: blob,
      });

      if (!putRes.ok) {
        throw new Error(`Upload failed with status ${putRes.status}`);
      }

      // 3. Record submission in public.volunteer_kyc
      const { error: insertError } = await supabase
        .from('volunteer_kyc')
        .insert({
          user_id: session.user.id,
          document_type: selectedDocType,
          file_path: uploadUrlData.filePath,
        });

      if (insertError) throw insertError;

      // 4. Update profiles.kyc_status to 'pending'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      Alert.alert('Verification Submitted', 'Your document has been submitted for review.');
      setSelectedFile(null);
      await loadKycState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      Alert.alert('Submission Error', msg);
    } finally {
      setIsUploading(false);
    }
  }

  const docTabs: Array<{ id: DocumentType; label: string }> = [
    { id: 'aadhaar', label: 'Aadhaar Card' },
    { id: 'student_id', label: 'Student ID' },
    { id: 'pan', label: 'Govt ID' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0F766E" />
        <Text className="text-xs text-[#6B7280] mt-3">Loading verification status...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-semibold text-[#111827] tracking-tight">
            Volunteer Identity Verification
          </Text>
          <Text className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
            AskUs Foundation requires verified identity documents for all field volunteers to safeguard community centres.
          </Text>
        </View>

        {/* Status Banners */}
        {kycStatus === 'pending' && (
          <View className="mb-6 p-4 bg-[#FFFBEB] border border-[#D97706]/30 rounded-standard">
            <Text className="text-sm font-semibold text-[#D97706]">
              Verification In Progress
            </Text>
            <Text className="text-xs text-[#6B7280] mt-1">
              Your documents are under review by the AskUs Operations Team. Ground operations will unlock once approved.
            </Text>
          </View>
        )}

        {kycStatus === 'verified' && (
          <View className="mb-6 p-4 bg-[#F0FDF4] border border-[#16A34A]/30 rounded-standard">
            <Text className="text-sm font-semibold text-[#16A34A]">
              Identity Verified
            </Text>
            <Text className="text-xs text-[#6B7280] mt-1">
              Your volunteer credentials are fully active. You have full access to field shifts and attendance logging.
            </Text>
          </View>
        )}

        {kycStatus === 'rejected' && (
          <View className="mb-6 p-4 bg-[#FEF2F2] border border-[#DC2626]/30 rounded-standard">
            <Text className="text-sm font-semibold text-[#DC2626]">
              Verification Document Rejected
            </Text>
            <Text className="text-xs text-[#6B7280] mt-1">
              Reason: {existingRecord?.rejection_reason ?? 'Document unreadable or invalid.'}. Please upload a clear official ID.
            </Text>
          </View>
        )}

        {/* Upload Form - Rendered when not_submitted or rejected */}
        {(kycStatus === 'not_submitted' || kycStatus === 'rejected') && (
          <View className="space-y-5">
            {/* Segmented Pill Tabs */}
            <View>
              <Text className="text-xs font-medium text-[#111827] uppercase tracking-wider mb-2.5">
                Select Document Type
              </Text>
              <View className="flex-row bg-[#F9FAFB] p-1 border border-[#E5E7EB] rounded-standard">
                {docTabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setSelectedDocType(tab.id)}
                    className={`flex-1 py-2 items-center rounded-md ${
                      selectedDocType === tab.id
                        ? 'bg-white shadow-card border border-[#E5E7EB]'
                        : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selectedDocType === tab.id ? 'text-[#0F766E]' : 'text-[#6B7280]'
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Document Uploader */}
            <View>
              <Text className="text-xs font-medium text-[#111827] uppercase tracking-wider mb-2.5">
                Upload Identification Document
              </Text>
              <DocumentUploader
                onFileSelected={(file) => setSelectedFile(file)}
                selectedFile={selectedFile}
                onClear={() => setSelectedFile(null)}
                isUploading={isUploading}
              />
            </View>

            {/* Submit Action */}
            <Button
              label={isUploading ? 'Encrypting & Uploading...' : 'Submit Verification Document'}
              onPress={handleSubmitKyc}
              variant="primary"
              size="lg"
              isLoading={isUploading}
              disabled={!selectedFile || isUploading}
              className="mt-4"
            />
          </View>
        )}

        {/* Zero-Data / Null State (Rendered when not submitted and no file chosen) */}
        {kycStatus === 'not_submitted' && !selectedFile && (
          <View className="mt-8">
            <EmptyStateContainer
              title="No Document Submitted"
              description="Upload an official ID card (Aadhaar, Student ID, or Govt ID) to unlock field drives and relief shifts."
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
