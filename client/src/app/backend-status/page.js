"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Clock3,
  RefreshCcw,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const HEALTH_URL = `${BACKEND_BASE_URL}/health`;

const formatUptime = (seconds) => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return "Unknown";
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

function StatusPill({ status }) {
  const isHealthy = String(status || "").toUpperCase() === "OK";
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]",
        isHealthy
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/30 bg-red-500/10 text-red-300",
      )}
    >
      {status || "Unknown"}
    </Badge>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/20 p-3">
      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </span>
      <span className="break-all font-mono text-xs text-white/90">{value}</span>
    </div>
  );
}

function BackendStatusContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [responseTime, setResponseTime] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError("");

    const startedAt = performance.now();

    try {
      const response = await fetch(HEALTH_URL, { cache: "no-store" });
      const elapsed = Math.round(performance.now() - startedAt);

      if (!response.ok) {
        throw new Error(`Health check failed (${response.status})`);
      }

      const data = await response.json();
      setHealth(data);
      setResponseTime(elapsed);
      setLastChecked(new Date());
    } catch (err) {
      setError(err.message || "Unable to fetch backend status");
      setHealth(null);
      setResponseTime(null);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const uptimeLabel = useMemo(
    () => formatUptime(health?.uptime),
    [health?.uptime],
  );
  const status = health?.status || (error ? "DOWN" : "UNKNOWN");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <Activity className="h-3.5 w-3.5" />
            Backend Status
          </div>
          <h1 className="text-3xl mt-2 font-bold tracking-tight">
            Service health and connectivity
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A quick view of the backend endpoint, response time, and uptime so
            you can verify the platform before you test payout flows.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full sm:w-auto rounded-full px-5 text-sm font-semibold">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/25">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Server className="h-5 w-5 text-primary" />
                Backend Health
              </CardTitle>
              <StatusPill status={status} />
            </div>
            <CardDescription>
              Checked against{" "}
              <span className="font-mono text-white">{HEALTH_URL}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Status
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {loading ? "Checking…" : status}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error ? error : "Health endpoint returned successfully."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Response time
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {responseTime !== null ? `${responseTime} ms` : "—"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Last measured from this page.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Uptime
              </p>
              <p className="mt-2 text-2xl font-semibold">{uptimeLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on the `/health` response payload.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Last checked
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {lastChecked ? lastChecked.toLocaleTimeString() : "—"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Refresh manually to re-check.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
            <Button
              onClick={fetchHealth}
              className="w-full sm:w-auto rounded-full px-5 text-sm font-semibold"
              disabled={loading}
            >
              <RefreshCcw
                className={cn("h-4 w-4", loading && "animate-spin")}
              />
              {loading ? "Checking..." : "Refresh Status"}
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto rounded-full px-5 text-sm font-semibold"
            >
              <a href={HEALTH_URL} target="_blank" rel="noreferrer">
                <Sparkles className="h-4 w-4" />
                Open Health Endpoint
              </a>
            </Button>
          </CardFooter>
        </Card>

        <div className="grid gap-4">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Deployment Details</CardTitle>
              <CardDescription>
                Quick reference for your current environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <DetailRow label="API Base URL" value={API_BASE_URL} />
              <DetailRow label="Backend Origin" value={BACKEND_BASE_URL} />
              <DetailRow label="Health URL" value={HEALTH_URL} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BackendStatusPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <BackendStatusContent />
    </RoleGuard>
  );
}
