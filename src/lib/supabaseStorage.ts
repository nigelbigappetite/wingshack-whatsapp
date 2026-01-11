import { supabaseAdmin } from './supabaseAdmin'

export async function uploadToStorage(
  file: File,
  path: string
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('whatsapp-media')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from('whatsapp-media')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

