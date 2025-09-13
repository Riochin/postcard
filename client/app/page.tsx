"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/auth");
  }, [router]);

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Postcard App</h1>
      <p>Redirecting to authentication...</p>
    </main>
  );
}
