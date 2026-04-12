import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadImage(file) {
  const ext = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('note-images')
    .upload(fileName, file)
  if (error) throw error
  const { data } = supabase.storage
    .from('note-images')
    .getPublicUrl(fileName)
  return data.publicUrl
}
