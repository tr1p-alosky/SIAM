import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | undefined;
let supabaseAuthClient: SupabaseClient | undefined;

export function getSupabaseAuthClient(): SupabaseClient {
  if (supabaseAuthClient) {
    return supabaseAuthClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonymousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonymousKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to use Supabase Auth.",
    );
  }

  supabaseAuthClient = createClient(supabaseUrl, anonymousKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAuthClient;
}

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to use Supabase Storage.",
    );
  }

  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

export function getSupabaseStorageBucket() {
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET;

  if (!bucketName) {
    throw new Error("Set SUPABASE_STORAGE_BUCKET to use Supabase Storage.");
  }

  return getSupabaseClient().storage.from(bucketName);
}