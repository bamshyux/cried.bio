import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/data/profiles";
import { sendWelcomeEmail } from "@/lib/email";
import { syncSignupBadges } from "@/lib/badges/signup-badges";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email && (type === "signup" || type === "email")) {
        const profile = await getProfileByUserId(user.id);
        await syncSignupBadges(user.id);
        void sendWelcomeEmail({
          to: user.email,
          displayName: profile?.display_name,
          username: profile?.username,
        });
      }

      redirect(next);
    }

    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?error=Invalid confirmation link");
}
