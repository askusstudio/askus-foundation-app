import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import { KycSubmissionSchema } from '@/utils/validators';

export interface UploadKycParams {
  userId: string;
  documentType: 'aadhaar' | 'student_id' | 'pan';
  base64Data: string;
  fileExtension: 'jpg' | 'png' | 'pdf';
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf';
}

export const submitVolunteerKyc = async (params: UploadKycParams) => {
  // Gate 7: Strict input sanitization before dispatch
  const validated = KycSubmissionSchema.parse(params);

  const timestamp = Date.now();
  const filePath = `${validated.userId}/${timestamp}_${validated.documentType}.${validated.fileExtension}`;

  // 1. Direct upload into private bucket via authenticated session
  const { error: uploadError } = await supabase.storage
    .from('kyc-documents')
    .upload(filePath, decode(validated.base64Data), {
      contentType: validated.mimeType,
      upsert: false,
    });

  if (uploadError) throw new Error(`Document upload failed: ${uploadError.message}`);

  // 2. Insert record into volunteer_kyc table
  const { error: dbError } = await supabase.from('volunteer_kyc').insert({
    user_id: validated.userId,
    document_type: validated.documentType,
    file_path: filePath,
  });

  if (dbError) throw new Error(`Database entry failed: ${dbError.message}`);

  // 3. Update profile state to pending
  await supabase
    .from('profiles')
    .update({ kyc_status: 'pending' })
    .eq('id', validated.userId);

  return { success: true, filePath };
};
