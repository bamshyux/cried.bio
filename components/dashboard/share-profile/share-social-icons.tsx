import type { ReactNode } from "react";
import { SiDiscord, SiReddit, SiX } from "react-icons/si";
import { FaFacebook, FaInstagram, FaTelegram, FaWhatsapp } from "react-icons/fa6";

const iconClassName = "h-[18px] w-[18px] shrink-0";

export function ShareChipIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center leading-none">
      {children}
    </span>
  );
}

export function ShareIconDiscord() {
  return (
    <ShareChipIcon>
      <SiDiscord className={iconClassName} aria-hidden />
    </ShareChipIcon>
  );
}

export function ShareIconX() {
  return (
    <ShareChipIcon>
      <SiX className={iconClassName} aria-hidden />
    </ShareChipIcon>
  );
}

export function ShareIconReddit() {
  return (
    <ShareChipIcon>
      <SiReddit className={iconClassName} aria-hidden />
    </ShareChipIcon>
  );
}

export function ShareIconFacebook() {
  return (
    <ShareChipIcon>
      <FaFacebook className={iconClassName} aria-hidden />
    </ShareChipIcon>
  );
}

export function ShareIconWhatsapp() {
  return (
    <ShareChipIcon>
      <FaWhatsapp className={iconClassName} aria-hidden />
    </ShareChipIcon>
  );
}

export function ShareIconTelegram() {
  return (
    <ShareChipIcon>
      <FaTelegram className={iconClassName} aria-hidden />
    </ShareChipIcon>
  );
}

export function ShareIconInstagram() {
  return (
    <ShareChipIcon>
      <FaInstagram className={iconClassName} aria-hidden />
    </ShareChipIcon>
  );
}
