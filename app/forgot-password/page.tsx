import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Reset password" subtitle="We will email you a link to choose a new password">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
