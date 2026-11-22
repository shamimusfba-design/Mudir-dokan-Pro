import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const SUPABASE_STORAGE_BUCKET = (process.env.SUPABASE_STORAGE_BUCKET || 'mudipro-media').trim();
export const isSupabaseBackendEnabled = Boolean(supabaseUrl && supabaseServiceRoleKey);

export const supabaseAdmin: SupabaseClient | null = isSupabaseBackendEnabled
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

let bucketVerified = false;

async function ensurePublicBucket(client: SupabaseClient): Promise<void> {
  if (bucketVerified) return;
  const { data: existing, error: getErr } = await client.storage.getBucket(SUPABASE_STORAGE_BUCKET);
  if (!getErr && existing) {
    bucketVerified = true;
    return;
  }
  const { error: createErr } = await client.storage.createBucket(SUPABASE_STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'],
  });
  if (createErr && !createErr.message.toLowerCase().includes('already exists')) {
    throw new Error(`Supabase Storage bucket error: ${createErr.message}`);
  }
  bucketVerified = true;
}

export async function uploadBufferToSupabaseStorage(params: {
  buffer: Buffer;
  mimeType: string;
  objectPath: string;
}): Promise<{ publicUrl: string }> {
  if (!supabaseAdmin) {
    throw new Error('Supabase Storage is not configured on the server.');
  }
  await ensurePublicBucket(supabaseAdmin);

  const { error: uploadErr } = await supabaseAdmin.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(params.objectPath, params.buffer, {
      contentType: params.mimeType,
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadErr) {
    throw new Error(`Supabase Storage upload failed: ${uploadErr.message}`);
  }

  const { data } = supabaseAdmin.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(params.objectPath);
  return { publicUrl: data.publicUrl };
}
