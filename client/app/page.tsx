"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check for authentication token in localStorage
    const isAuthenticated = !!localStorage.getItem("authToken");
    if (!isAuthenticated) {
      router.push("/auth");
    }
  }, [router]);

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>ポストカードアプリ</h1>
      <p>認証ページにリダイレクト中...</p>
    </main>
  );
}
