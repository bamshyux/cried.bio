import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { SITE_HOST } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — cried.bio",
  description: "Privacy Policy for cried.bio, explaining how we collect, use, and protect your data.",
};

const LAST_UPDATED = "June 14, 2026";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        cried.bio (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates{" "}
        <strong>{SITE_HOST}</strong> and related services (the &ldquo;Service&rdquo;). This Privacy
        Policy explains how we collect, use, disclose, and protect information when you use cried.bio,
        including when you create an account, customize your profile, or visit public profile pages.
      </p>
      <p>
        By using the Service, you agree to the practices described here. If you do not agree, please do
        not use cried.bio. For terms governing your use of the Service, see our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>Information you provide</h3>
      <ul>
        <li><strong>Account data:</strong> Email address, password (stored securely by our authentication provider), and account identifiers.</li>
        <li><strong>Profile data:</strong> Username, display name, bio, avatar, banner, status text, social links, themes, embeds, music settings, and other customization choices.</li>
        <li><strong>Social and community data:</strong> Follows, friend requests, guestbook messages, reactions, and notifications you send or receive.</li>
        <li><strong>Communications:</strong> Messages you send to us, such as support requests.</li>
      </ul>

      <h3>Information collected automatically</h3>
      <ul>
        <li><strong>Usage and analytics:</strong> Profile views, link clicks, session data, referrer URLs, device type, browser type, and general location derived from IP address (such as country or region).</li>
        <li><strong>Log data:</strong> IP address, timestamps, pages visited, and error logs used for security, debugging, and performance.</li>
        <li><strong>Cookies and similar technologies:</strong> Session cookies required for authentication and preferences. See Section 8 for details.</li>
      </ul>

      <h3>Information from third parties</h3>
      <p>
        If you connect third-party accounts or embed third-party content (such as music players or social
        widgets), those providers may share limited information according to their own policies. cried.bio
        does not receive your passwords for third-party services.
      </p>

      <h2>2. How We Use Information</h2>
      <p>We use collected information to:</p>
      <ul>
        <li>Create and manage your account and public profile;</li>
        <li>Provide dashboard features, analytics, badges, guestbook, and social tools;</li>
        <li>Send transactional emails such as welcome messages, notifications, password resets, and security alerts;</li>
        <li>Moderate content, prevent abuse, and enforce our Terms of Service;</li>
        <li>Improve, maintain, and secure the Service;</li>
        <li>Respond to support requests and legal obligations;</li>
        <li>Develop new features and measure engagement.</li>
      </ul>
      <p>
        We do not sell your personal information. We do not use your private account data to train
        third-party AI models.
      </p>

      <h2>3. Public Information</h2>
      <p>
        cried.bio profiles are designed to be public. Information you choose to display — including your
        username, display name, bio, links, badges, guestbook entries (where approved), follower counts,
        activity feeds (when enabled), and media — may be visible to anyone on the internet and may be
        indexed by search engines.
      </p>
      <p>
        Please do not include sensitive personal information on your public profile unless you intend for
        it to be publicly available.
      </p>

      <h2>4. How We Share Information</h2>
      <p>We may share information in the following circumstances:</p>
      <ul>
        <li><strong>Publicly:</strong> Profile content you publish is visible to visitors of your profile URL.</li>
        <li><strong>Service providers:</strong> We use trusted vendors to operate the Service, including hosting, database, authentication, email delivery, analytics, and infrastructure providers. These providers process data on our behalf under contractual obligations.</li>
        <li><strong>Legal requirements:</strong> We may disclose information if required by law, court order, or government request, or when we believe disclosure is necessary to protect rights, safety, or the integrity of the Service.</li>
        <li><strong>Business transfers:</strong> If cried.bio is involved in a merger, acquisition, or asset sale, user information may be transferred as part of that transaction.</li>
        <li><strong>With your direction:</strong> When you explicitly request or authorize sharing.</li>
      </ul>

      <h2>5. Service Providers</h2>
      <p>
        cried.bio relies on third-party infrastructure to deliver the Service. These may include:
      </p>
      <ul>
        <li><strong>Supabase</strong> — authentication, database, and file storage;</li>
        <li><strong>Vercel</strong> — application hosting and delivery;</li>
        <li><strong>Resend</strong> — transactional email delivery;</li>
        <li>Analytics and monitoring tools used to maintain reliability and security.</li>
      </ul>
      <p>
        Each provider maintains its own privacy and security practices. We select providers that meet
        our standards for data protection, but we encourage you to review their policies independently.
      </p>

      <h2>6. Email Communications</h2>
      <p>
        We send emails related to your account, including welcome messages, social and guestbook
        notifications, badge awards, and password reset links. These emails are sent from{" "}
        <strong>noreply@cried.bio</strong> or other cried.bio addresses. You cannot opt out of
        essential transactional emails while maintaining an active account. We do not send promotional
        marketing emails without your consent.
      </p>

      <h2>7. Data Retention</h2>
      <p>
        We retain account and profile data for as long as your account is active or as needed to provide
        the Service. Analytics and log data may be retained for a shorter period for security and
        operational purposes. When you delete content or close your account, we will delete or
        anonymize your data within a reasonable timeframe, except where retention is required for legal,
        security, or backup purposes.
      </p>

      <h2>8. Cookies and Local Storage</h2>
      <p>
        cried.bio uses cookies and similar browser storage technologies to keep you signed in, remember
        preferences, and protect against abuse. Essential cookies are required for authentication. We may
        also use analytics cookies to understand how the Service is used.
      </p>
      <p>
        You can control cookies through your browser settings. Disabling essential cookies may prevent
        you from logging in or using certain features.
      </p>

      <h2>9. Security</h2>
      <p>
        We implement administrative, technical, and organizational measures designed to protect your
        information, including encryption in transit (HTTPS), access controls, and secure authentication
        practices. No method of transmission or storage is completely secure, and we cannot guarantee
        absolute security.
      </p>
      <p>
        You are responsible for maintaining the confidentiality of your password and for activity under
        your account. Notify us immediately at{" "}
        <a href={`mailto:support@${SITE_HOST}`}>support@{SITE_HOST}</a> if you suspect unauthorized access.
      </p>

      <h2>10. Children&apos;s Privacy</h2>
      <p>
        cried.bio is not directed to children under 13, and we do not knowingly collect personal
        information from children under 13. If you believe a child under 13 has provided us with personal
        information, contact us and we will take steps to delete it.
      </p>

      <h2>11. International Users</h2>
      <p>
        cried.bio is operated from the United States. If you access the Service from outside the United
        States, your information may be transferred to, stored in, and processed in the United States or
        other countries where our service providers operate. By using cried.bio, you consent to such
        transfers.
      </p>

      <h2>12. Your Rights and Choices</h2>
      <p>Depending on your location, you may have rights to:</p>
      <ul>
        <li>Access the personal information we hold about you;</li>
        <li>Correct inaccurate information through your dashboard settings;</li>
        <li>Delete your account and associated data;</li>
        <li>Object to or restrict certain processing;</li>
        <li>Export your data in a portable format where technically feasible;</li>
        <li>Withdraw consent where processing is based on consent.</li>
      </ul>
      <p>
        To exercise these rights, contact{" "}
        <a href={`mailto:privacy@${SITE_HOST}`}>privacy@{SITE_HOST}</a>. We may need to verify your
        identity before fulfilling a request. Residents of the European Economic Area, United Kingdom,
        and certain U.S. states may have additional rights under applicable privacy laws.
      </p>

      <h2>13. California Privacy Notice</h2>
      <p>
        If you are a California resident, you may have rights under the California Consumer Privacy Act
        (CCPA/CPRA), including the right to know what personal information we collect, request deletion,
        and opt out of the sale or sharing of personal information. As stated above, cried.bio does not
        sell personal information. To submit a request, email{" "}
        <a href={`mailto:privacy@${SITE_HOST}`}>privacy@{SITE_HOST}</a>.
      </p>

      <h2>14. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will revise the &ldquo;Last
        updated&rdquo; date at the top of this page. Material changes may be communicated through the
        Service or by email. Your continued use after changes take effect constitutes acceptance of the
        updated policy.
      </p>

      <h2>15. Contact Us</h2>
      <p>
        If you have questions or concerns about this Privacy Policy or our data practices, contact us at:
      </p>
      <ul>
        <li>Email: <a href={`mailto:privacy@${SITE_HOST}`}>privacy@{SITE_HOST}</a></li>
        <li>Support: <a href={`mailto:support@${SITE_HOST}`}>support@{SITE_HOST}</a></li>
        <li>Website: <a href={`https://${SITE_HOST}`}>https://{SITE_HOST}</a></li>
      </ul>
    </LegalPageLayout>
  );
}
