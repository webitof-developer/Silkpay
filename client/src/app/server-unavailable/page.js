"use client";

import { useRouter } from "next/navigation";
import { ServerUnavailable } from "@/components/shared/ServerUnavailable";

export default function ServerUnavailablePage() {
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  return (
    <ServerUnavailable
      backendUrl={backendUrl}
      onRetry={() => router.refresh()}
      retryLabel="Retry page"
    />
  );
}
