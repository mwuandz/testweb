"use client";

import { useEffect } from "react";

export default function AdminPage() {
  useEffect(() => {}, []);
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-2xl font-black">Admin đang khôi phục</h1>
        <p className="text-slate-500">
          File admin bị ghi đè nhầm. Đang upload bản đầy đủ. Vui lòng F5 sau 1 phút.
        </p>
        <a href="/" className="inline-block rounded-xl bg-red-600 text-white px-5 py-3 font-bold">
          Về trang chủ
        </a>
      </div>
    </div>
  );
}
