"use client";

import { CardBorderEffect } from "@/components/profile/card-border-effect";
import { resolveLayoutBorderRadius } from "@/lib/settings";
import { ProfileCardFrame } from "./layout-primitives";
import { useCardLayoutEditState } from "./profile-card-layout-editor";
import { ProfileCardHeightScaler } from "./profile-card-height-scaler";
import { ProfileParallaxCard } from "./profile-parallax";
import type { ProfileSettings } from "@/lib/types/settings";
import type { ReactNode } from "react";

export function ProfileCardLayoutBody({
  settings,
  parallaxEnabled,
  children,
}: {
  settings: ProfileSettings;
  parallaxEnabled: boolean;
  children: ReactNode;
}) {
  const editLayout = useCardLayoutEditState();
  const maxHeight = editLayout?.maxHeight ?? settings.card_max_height;

  return (
    <ProfileParallaxCard enabled={parallaxEnabled}>
      <ProfileCardFrame settings={settings}>
        <ProfileCardHeightScaler maxHeight={maxHeight} parallaxEnabled={parallaxEnabled}>
          <CardBorderEffect
            settings={settings}
            target="main"
            borderRadius={resolveLayoutBorderRadius(settings)}
            className="w-full"
          >
            {children}
          </CardBorderEffect>
        </ProfileCardHeightScaler>
      </ProfileCardFrame>
    </ProfileParallaxCard>
  );
}
