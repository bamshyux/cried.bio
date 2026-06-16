import {
  COMMUNITY_THEMES_PAGE_SIZE,
  searchCommunityThemes,
} from "@/lib/data/community-themes";
import type { CommunityThemeSort } from "@/lib/types/community-theme";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = data.claims.sub as string;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "all";
  const sort = (searchParams.get("sort") ?? "trending") as CommunityThemeSort;
  const page = Number(searchParams.get("page") ?? "1");

  const result = await searchCommunityThemes({
    query,
    category,
    sort,
    page: Number.isFinite(page) ? page : 1,
    pageSize: COMMUNITY_THEMES_PAGE_SIZE,
    userId,
  });

  return NextResponse.json(result);
}
