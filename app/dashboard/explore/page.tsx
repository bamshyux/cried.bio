import { SectionHub } from "@/components/dashboard/section-hub";
import { DASHBOARD_SECTIONS } from "@/lib/dashboard/navigation";

const section = DASHBOARD_SECTIONS.find((s) => s.id === "explore")!;

export default function ExploreHubPage() {
  return <SectionHub section={section} />;
}
