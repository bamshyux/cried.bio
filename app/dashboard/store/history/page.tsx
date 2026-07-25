import { redirect } from "next/navigation";

export default function StoreHistoryRedirectPage() {
  redirect("/dashboard/settings?tab=billing");
}
