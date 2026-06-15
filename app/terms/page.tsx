import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { SITE_HOST } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service — cried.bio",
  description: "Terms of Service for cried.bio, the bio link platform for creators.",
};

const LAST_UPDATED = "June 14, 2026";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        Welcome to cried.bio. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
        the cried.bio website, applications, and related services (collectively, the &ldquo;Service&rdquo;)
        operated at <strong>{SITE_HOST}</strong> (&ldquo;cried.bio,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
        or &ldquo;our&rdquo;). By creating an account, accessing, or using the Service, you agree to be
        bound by these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 13 years old to use cried.bio. If you are under 18, you represent that you
        have permission from a parent or legal guardian. You must provide accurate registration
        information and keep your account credentials secure. You are responsible for all activity that
        occurs under your account.
      </p>

      <h2>2. The Service</h2>
      <p>
        cried.bio provides customizable public profile pages, social links, analytics, badges, guestbook
        features, embeds, themes, and related creator tools. We may add, change, or remove features at
        any time. Some features may be labeled as beta, experimental, or premium and may be subject to
        additional terms or fees.
      </p>

      <h2>3. Your Account and Profile</h2>
      <p>When you create a cried.bio profile, you agree that:</p>
      <ul>
        <li>Your username, display name, bio, links, media, and other profile content are your responsibility.</li>
        <li>You will not impersonate another person or misrepresent your affiliation with any entity.</li>
        <li>You will not register usernames intended to confuse, squat on trademarks, or infringe third-party rights.</li>
        <li>You grant cried.bio a non-exclusive, worldwide, royalty-free license to host, display, reproduce, and distribute your profile content solely to operate and promote the Service.</li>
      </ul>
      <p>
        You retain ownership of content you submit. You may delete your profile content at any time through
        the dashboard, subject to reasonable backup and caching delays.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to use cried.bio to:</p>
      <ul>
        <li>Violate any applicable law, regulation, or third-party rights.</li>
        <li>Post or link to unlawful, harassing, hateful, threatening, sexually exploitative, or violent material.</li>
        <li>Distribute malware, phishing pages, spam, or deceptive schemes.</li>
        <li>Scrape, crawl, or reverse engineer the Service except as permitted by law.</li>
        <li>Attempt to gain unauthorized access to accounts, systems, or data.</li>
        <li>Interfere with or disrupt the Service, including through automated abuse or excessive API use.</li>
        <li>Circumvent security, rate limits, moderation tools, or premium restrictions.</li>
      </ul>
      <p>
        We may investigate violations and remove content, suspend accounts, or terminate access at our
        discretion, with or without notice, especially where required to protect users or comply with law.
      </p>

      <h2>5. Public Profiles and User Content</h2>
      <p>
        cried.bio profiles are public by default unless a feature explicitly restricts visibility. Content
        you publish — including links, guestbook entries, status text, badges, embeds, and media — may be
        viewed, shared, and indexed by search engines. Do not post information you do not want to be public.
      </p>
      <p>
        Guestbook, follow, friend, and social features may allow other users to interact with your profile.
        Profile owners may moderate guestbook content and manage social settings through the dashboard.
        You are responsible for interactions you initiate on other users&apos; profiles.
      </p>

      <h2>6. Third-Party Links and Services</h2>
      <p>
        Your profile may contain links to third-party websites, platforms, and embedded content. cried.bio
        does not control and is not responsible for third-party services, their terms, privacy practices,
        or content. Your use of third-party services is at your own risk.
      </p>

      <h2>7. Analytics and Cookies</h2>
      <p>
        cried.bio may collect usage and analytics data related to profile views, link clicks, and dashboard
        activity to provide statistics and improve the Service. Our use of data is described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>. By using the Service, you consent to such processing
        as described there.
      </p>

      <h2>8. Premium Features and Payments</h2>
      <p>
        If cried.bio offers paid or premium features, additional payment terms may apply at checkout.
        Fees are non-refundable except where required by law or explicitly stated. We may change pricing
        with reasonable notice. Failure to pay may result in downgrade or loss of premium access.
      </p>

      <h2>9. Badges, Milestones, and Virtual Items</h2>
      <p>
        Badges, milestones, and similar recognition features have no monetary value, are not transferable,
        and may be awarded, modified, or revoked by cried.bio at any time. We do not guarantee permanent
        availability of any badge, rarity tier, or cosmetic feature.
      </p>

      <h2>10. Intellectual Property</h2>
      <p>
        The cried.bio name, logo, branding, software, design, and underlying technology are owned by
        cried.bio or its licensors and are protected by intellectual property laws. Except for the limited
        rights expressly granted in these Terms, no license is granted to you. You may not copy, modify,
        distribute, or create derivative works of the Service without our prior written consent.
      </p>

      <h2>11. Copyright and DMCA</h2>
      <p>
        We respect intellectual property rights. If you believe content on cried.bio infringes your
        copyright, contact us at{" "}
        <a href={`mailto:legal@${SITE_HOST}`}>legal@{SITE_HOST}</a> with:
      </p>
      <ul>
        <li>Identification of the copyrighted work;</li>
        <li>Identification of the infringing material and its location on the Service;</li>
        <li>Your contact information;</li>
        <li>A statement of good-faith belief that use is unauthorized; and</li>
        <li>A statement, under penalty of perjury, that your notice is accurate and you are authorized to act.</li>
      </ul>
      <p>We may remove reported content and terminate repeat infringers where appropriate.</p>

      <h2>12. Termination</h2>
      <p>
        You may stop using cried.bio at any time. We may suspend or terminate your account if you violate
        these Terms, create risk for other users, or if we discontinue the Service. Upon termination, your
        right to use the Service ends immediately. Provisions that by nature should survive — including
        disclaimers, limitations of liability, and dispute terms — will survive termination.
      </p>

      <h2>13. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF
        ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE
        WILL BE UNINTERRUPTED, SECURE, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
      </p>

      <h2>14. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRIED.BIO AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND
        AFFILIATES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
        DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING FROM YOUR
        USE OF OR INABILITY TO USE THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE
        TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE (12)
        MONTHS BEFORE THE CLAIM OR (B) FIFTY US DOLLARS ($50).
      </p>
      <p>
        Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to
        the fullest extent permitted by law.
      </p>

      <h2>15. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless cried.bio from claims, damages, losses, and
        expenses (including reasonable legal fees) arising from your content, your use of the Service,
        your violation of these Terms, or your violation of any third-party rights.
      </p>

      <h2>16. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. When we do, we will revise the &ldquo;Last
        updated&rdquo; date at the top of this page. Material changes may also be communicated through
        the Service or by email. Continued use after changes become effective constitutes acceptance of
        the revised Terms.
      </p>

      <h2>17. Governing Law and Disputes</h2>
      <p>
        These Terms are governed by the laws of the United States and the State of Delaware, without
        regard to conflict-of-law principles, except where mandatory consumer protection laws in your
        jurisdiction apply. Any dispute arising from these Terms or the Service shall be resolved in the
        state or federal courts located in Delaware, unless applicable law requires otherwise.
      </p>

      <h2>18. General</h2>
      <ul>
        <li><strong>Entire agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and cried.bio regarding the Service.</li>
        <li><strong>Severability:</strong> If any provision is unenforceable, the remaining provisions remain in effect.</li>
        <li><strong>No waiver:</strong> Failure to enforce a provision is not a waiver of our right to enforce it later.</li>
        <li><strong>Assignment:</strong> You may not assign these Terms without our consent. We may assign them in connection with a merger, acquisition, or sale of assets.</li>
      </ul>

      <h2>19. Contact</h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href={`mailto:legal@${SITE_HOST}`}>legal@{SITE_HOST}</a> or{" "}
        <a href={`mailto:support@${SITE_HOST}`}>support@{SITE_HOST}</a>.
      </p>
    </LegalPageLayout>
  );
}
