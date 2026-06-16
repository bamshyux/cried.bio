import { handleAuthConfirm } from "@/lib/auth/confirm-handler";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return handleAuthConfirm(request);
}
