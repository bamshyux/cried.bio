import { PremiumSubnav } from "@/components/premium/premium-subnav";

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PremiumSubnav />
      {children}
    </div>
  );
}
