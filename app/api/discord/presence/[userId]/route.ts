import { NextResponse } from "next/server";
import { fetchLanyardPresence } from "@/lib/discord/lanyard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  if (!/^\d{17,20}$/.test(userId)) {
    return NextResponse.json({ presence: null }, { status: 400 });
  }

  const presence = await fetchLanyardPresence(userId);
  return NextResponse.json(
    { presence },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    },
  );
}
