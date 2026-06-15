import Link from "next/link";

export function ProfileCreateCta() {
  return (
    <Link href="/signup" className="bf-profile-cta group">
      <span className="bf-profile-cta__label">Create yours</span>
      <svg
        className="bf-profile-cta__arrow"
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden
      >
        <path
          d="M2 5h5.5M5.5 2.5 8 5 5.5 7.5"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
