import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#070B14] flex items-center justify-center">

      <div className="w-full max-w-md">

        <div className="mb-10 text-center">

          <div className="mx-auto w-20 h-20 rounded-2xl bg-cyan-500 flex items-center justify-center text-3xl font-bold text-black">
            MR
          </div>

          <h1 className="text-4xl font-bold text-white mt-6">
            VFX Pulse
          </h1>

          <p className="text-slate-400 mt-2">
            MR Production Database
          </p>

        </div>

        <LoginForm />

      </div>

    </main>
  );
}