import { NextResponse } from "next/server";
import { validateGiftRecipient } from "@/lib/gifts/validation";
import { createClient } from "@/lib/supabase/server";
import type { GiftProductTarget } from "@/lib/types/gift";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { recipientUsername?: string; target?: GiftProductTarget } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.recipientUsername?.trim() || !body.target) {
    return NextResponse.json({ error: "Recipient and product are required." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", data.claims.sub as string)
    .maybeSingle();

  const result = await validateGiftRecipient({
    recipientUsername: body.recipientUsername,
    buyerUserId: data.claims.sub as string,
    buyerUsername: profile?.username ?? null,
    target: body.target,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    recipientUsername: result.recipientUsername,
  });
}
