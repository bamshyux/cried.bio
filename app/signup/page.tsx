import { AuthLayout } from "@/components/auth/auth-layout";
import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <AuthLayout title="Create your profile" subtitle="Join cried.bio and forge your digital identity">
      <SignUpForm />
    </AuthLayout>
  );
}
