"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  RefreshCcw,
  ServerOff,
  Headphones,
  Activity,
} from "lucide-react";
import { BrandWordmark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ServerUnavailable({
  title = "Backend unavailable",
  message = "We could not connect to the backend right now. The app shell is loaded, but the server that powers auth and data is not responding.",
  backendUrl,
  statusUrl = "/backend-status",
  contactUrl = "/contact",
  onRetry,
  retryLabel = "Retry connection",
}) {
  const [probeState, setProbeState] = useState("checking");
  const [lastProbeAt, setLastProbeAt] = useState(null);

  const healthUrl = useMemo(() => {
    if (!backendUrl) return null;
    return backendUrl.replace(/\/api\/?$/, "") + "/health";
  }, [backendUrl]);

  const runProbe = async () => {
    if (!healthUrl) {
      setProbeState("unknown");
      setLastProbeAt(new Date());
      return;
    }

    setProbeState("checking");
    try {
      const response = await fetch(healthUrl, { cache: "no-store" });
      setProbeState(response.ok ? "online" : "down");
    } catch (error) {
      setProbeState("down");
    } finally {
      setLastProbeAt(new Date());
    }
  };

  useEffect(() => {
    runProbe();
    const interval = setInterval(runProbe, 15000);
    return () => clearInterval(interval);
  }, [healthUrl]);

  const statusLabel =
    probeState === "online"
      ? "Connected"
      : probeState === "down"
        ? "Disconnected"
        : "Checking...";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d0e12] px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(108,93,211,0.18),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(34,197,94,0.08),_transparent_35%)]" />
      <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-primary/20 blur-[110px]" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <BrandWordmark
            iconClassName="h-9 w-9"
            textClassName="text-xl sm:text-2xl"
          />
          <Button
            asChild
            variant="ghost"
            className="w-full rounded-full px-5 text-sm text-decoration-line: underline font-semibold text-muted-foreground hover:text-white sm:w-auto"
          >
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/25">
            <CardHeader className="space-y-4 pb-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
                <ServerOff className="h-3.5 w-3.5" />
                Connection lost
              </div>
              <CardTitle className="text-3xl sm:text-4xl">{title}</CardTitle>
              <CardDescription className="max-w-2xl text-base">
                {message}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Backend URL
                </p>
                <p className="mt-2 break-all text-sm font-mono text-white/90">
                  {backendUrl || "Not configured"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Connection summary
                </p>
                <p className="mt-2 text-sm font-semibold text-white/90">
                  {statusLabel}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lastProbeAt
                    ? `Last checked at ${lastProbeAt.toLocaleTimeString()}`
                    : "Probing the backend health endpoint"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  What still works
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The frontend is still loaded. You can check backend status or
                  contact the team.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
              <Button
                onClick={onRetry}
                className="w-full rounded-full px-5 text-sm font-semibold sm:w-auto"
              >
                <RefreshCcw className="h-4 w-4" />
                {retryLabel}
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full px-5 text-sm font-semibold sm:w-auto"
              >
                <Link href={statusUrl}>
                  <Activity className="h-4 w-4" />
                  Open Backend Status
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="w-full rounded-full px-5 text-sm font-semibold text-muted-foreground hover:text-white sm:w-auto"
              >
                <Link href={contactUrl}>
                  <Headphones className="h-4 w-4" />
                  Contact Sales
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <Activity className="h-3.5 w-3.5" />
                Quick status
              </div>
              <CardTitle className="mt-3 text-lg">What to check next</CardTitle>
              <CardDescription>
                Use this panel to confirm whether the API is actually down or
                just unreachable from this device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Probe result
                </p>
                <p className="mt-2 text-sm font-semibold text-white/90">
                  {statusLabel}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lastProbeAt
                    ? `Last checked at ${lastProbeAt.toLocaleTimeString()}`
                    : "Waiting for the first health probe"}
                </p>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" />
                  Refresh once after the backend is restarted.
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" />
                  Open the backend status page for live deployment details.
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" />
                  If the probe stays down, contact sales or support.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
