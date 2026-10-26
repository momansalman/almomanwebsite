"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveOrder } from "@/lib/orderTrackingStorage";

export default function OrderTrackingRootPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const active = getActiveOrder();
      if (active?.orderId) {
        router.replace(`/order-tracking/${active.orderId}`);
        return;
      }
      const lastId = localStorage.getItem("almoman_last_order_id");
      if (lastId) {
        router.replace(`/order-tracking/${lastId}`);
        return;
      }
    } catch {}

    router.replace("/track");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400">Opening your AL-MOMAN order tracking...</p>
      </div>
    </div>
  );
}
