import { AuthLayout } from "@/components/auth/auth-layout";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <AuthLayout title="Choose a new password" subtitle="Enter and confirm your new cried.bio password">
      <UpdatePasswordForm />
    </AuthLayout>
  );
}
