import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let probeClient: SupabaseClient | null = null;

/** Cookie-less client for schema probes — safe in static routes and root layout. */
export function createSchemaProbeClient(): SupabaseClient {
  if (probeClient) return probeClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  probeClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return probeClient;
}
