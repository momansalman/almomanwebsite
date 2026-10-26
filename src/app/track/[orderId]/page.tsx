"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TrackRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const orderId = params?.orderId;
    if (orderId) {
      router.replace(`/order-tracking/${orderId}`);
    } else {
      router.replace("/track");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400">Loading your AL-MOMAN order tracking...</p>
      </div>
    </div>
  );
}
