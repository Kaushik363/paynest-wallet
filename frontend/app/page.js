"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export default function AuthPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // already logged in? skip this page
  useEffect(() => {
    if (localStorage.getItem("token")) router.push("/dashboard");
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const path = isRegister ? "/auth/register" : "/auth/login";
      const body = isRegister ? { name, email, password } : { email, password };
      const data = await api(path, { method: "POST", body });

      localStorage.setItem("token", data.token);
      localStorage.setItem("name", data.user.name);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-3xl font-extrabold text-teal-900">PayNest</h1>
        <p className="mb-6 text-slate-600">
          {isRegister ? "Create a wallet in a few seconds." : "Log in to your wallet."}
        </p>

        <form onSubmit={handleSubmit} className="card space-y-3">
          {isRegister && (
            <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="btn w-full" disabled={loading}>
            {loading ? "Please wait..." : isRegister ? "Create account" : "Log in"}
          </button>
        </form>

        <button
          className="mt-4 text-sm text-teal-800 underline"
          onClick={() => { setIsRegister(!isRegister); setError(""); }}
        >
          {isRegister ? "I already have an account" : "I need an account"}
        </button>
      </div>
    </main>
  );
}
