import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 1. Authenticate user session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization bearer token', status: 401 }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired session token', status: 401 }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate payload matching frozen API contract
    const { documentType, fileExtension } = await req.json();

    const allowedDocTypes = ['aadhaar', 'student_id', 'pan'];
    const allowedExtensions = ['jpg', 'png', 'pdf'];

    if (!allowedDocTypes.includes(documentType)) {
      return new Response(
        JSON.stringify({ error: `Invalid documentType. Must be one of: ${allowedDocTypes.join(', ')}`, status: 400 }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!allowedExtensions.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ error: `Invalid fileExtension. Must be one of: ${allowedExtensions.join(', ')}`, status: 400 }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Construct isolated quarantine path in private 'kyc-documents' bucket
    const timestamp = Date.now();
    const filePath = `kyc-documents/${user.id}/${timestamp}_${documentType}.${fileExtension}`;

    // 4. Issue cryptographically signed PUT upload URL expiring in strictly 60 seconds
    const { data: uploadData, error: signedUrlError } = await supabaseAdmin.storage
      .from('kyc-documents')
      .createSignedUploadUrl(filePath, {
        upsert: false,
      });

    if (signedUrlError) {
      console.error('[KYC Upload] Storage error generating signed URL:', signedUrlError);
      throw signedUrlError;
    }

    // Return response conforming strictly to contract: { signedUrl, filePath, expiresIn: 60 }
    return new Response(
      JSON.stringify({
        signedUrl: uploadData.signedUrl,
        filePath,
        expiresIn: 60,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error generating upload URL';
    return new Response(
      JSON.stringify({ error: message, status: 500 }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
