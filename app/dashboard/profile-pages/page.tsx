import { redirect } from "next/navigation";

export default function LegacyProfilePagesRedirect() {
  redirect("/dashboard/pages");
}
