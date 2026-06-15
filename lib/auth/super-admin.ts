import { createClient } from "@/lib/supabase/server";

export const SUPER_ADMIN_EMAIL =
  process.env.BIOFORGE_SUPER_ADMIN_EMAIL?.trim().toLowerCase() ?? "jjbamshy1@gmail.com";

export async function isSuperAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export async function requireSuperAdmin(): Promise<
  { userId: string; email: string } | { error: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return { error: "You must be logged in." };
  }

  const email = (data.claims.email as string | undefined)?.trim().toLowerCase();
  if (!email || email !== SUPER_ADMIN_EMAIL) {
    return { error: "You do not have access to account management." };
  }

  return { userId: data.claims.sub as string, email };
}
