import { NextResponse } from "next/server";
import { getUnreadGiftNotifications } from "@/lib/data/gifts";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since") ?? undefined;

  const notifications = await getUnreadGiftNotifications(data.claims.sub as string, since);
  return NextResponse.json({ notifications });
}
