import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are not set. The app may not function correctly until they are configured in the .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
