import { redirect } from "next/navigation";

export default function PremiumIndexPage() {
  redirect("/dashboard/premium/plans");
}
