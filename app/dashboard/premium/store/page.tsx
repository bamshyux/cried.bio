import { redirect } from "next/navigation";

export default function LegacyPremiumStorePage() {
  redirect("/dashboard/store");
}
