export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || null;

export const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
