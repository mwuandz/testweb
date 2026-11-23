"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Loader2 } from "lucide-react";

const TOKEN_KEY = "mw_customer_token";
const USER_KEY = "mw_customer_user";

export default function DangNhapPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { contact, password }
          : { name, contact, email: email || undefined, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.customer));
      router.push("/tai-khoan");
    } catch {
      setError("Không kết nối được máy chủ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 noel-hero-bg">
      <div className="mx-auto max-w-md px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="card-surface p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-white">
              <User className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black">
              {mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Xem lịch sử đơn hàng và quản lý tài khoản"
                : "Tạo tài khoản để theo dõi đơn hàng dễ dàng"}
            </p>
          </div>

          {/* Toggle */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`rounded-xl py-2.5 text-sm font-bold transition ${
                mode === "login" ? "bg-slate-50 dark:bg-slate-950 shadow text-slate-900 dark:text-slate-50" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`rounded-xl py-2.5 text-sm font-bold transition ${
                mode === "register" ? "bg-slate-50 dark:bg-slate-950 shadow text-slate-900 dark:text-slate-50" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Họ tên *"
                required
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
              />
            )}
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Zalo / Số điện thoại *"
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
            />
            {mode === "register" && (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (tuỳ chọn)"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
              />
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Mật khẩu (tối thiểu 6 ký tự) *" : "Mật khẩu *"}
              required
              minLength={mode === "register" ? 6 : 1}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
            />

            {error && (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : mode === "login" ? (
                "Đăng nhập"
              ) : (
                "Tạo tài khoản"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Dùng cùng số Zalo/SĐT khi đặt hàng để xem lịch sử đơn tự động.
          </p>
        </div>
      </div>
    </div>
  );
}
