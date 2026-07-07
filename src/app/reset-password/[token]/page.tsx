import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

type ResetPasswordPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { token } = await params;

  return (
    <main className="min-h-screen">
      <ResetPasswordForm token={token} />
    </main>
  );
}
