import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: "20px",
      }}
    >
      <h1>🎬 VFX Pulse</h1>

      <p>Production Management System</p>

      <Link href="/login">
        <button
          style={{
            padding: "12px 24px",
            cursor: "pointer",
          }}
        >
          Go to Login
        </button>
      </Link>
    </main>
  );
}