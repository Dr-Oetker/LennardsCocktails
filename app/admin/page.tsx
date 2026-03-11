"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Falsches Passwort");
      }
    } catch (error) {
      console.error("Login-Fehler:", error);
      setError("Fehler beim Login. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-sm border border-[#e5e3e0] p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] mb-2 tracking-tight">
            Lennards Cocktails
          </h1>
          <p className="text-sm sm:text-base text-[#6b6b6b] font-medium">Admin-Bereich</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#1a1a1a] mb-2"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#e5e3e0] rounded-lg focus:ring-2 focus:ring-[#c9732f] focus:border-[#c9732f] bg-white text-[#1a1a1a] placeholder:text-[#6b6b6b] transition-colors"
              placeholder="Admin-Passwort eingeben"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-[#faeaea] border border-[#e8c4c4] text-[#8b2e2e] px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {loading ? "Wird geladen..." : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
