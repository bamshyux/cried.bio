"use client";

import { useState } from "react";
import {
  ShareProfileModal,
  ShareProfileTriggerIcon,
  shareProfileButtonClassName,
} from "@/components/dashboard/share-profile/share-profile-modal";

type ShareProfileButtonProps = {
  username: string;
  profileUrl: string;
  className?: string;
};

export function ShareProfileButton({
  username,
  profileUrl,
  className = "",
}: ShareProfileButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${shareProfileButtonClassName} ${className}`}
      >
        <ShareProfileTriggerIcon />
        <span>Share Profile</span>
      </button>

      <ShareProfileModal
        open={open}
        onClose={() => setOpen(false)}
        username={username}
        profileUrl={profileUrl}
      />
    </>
  );
}
