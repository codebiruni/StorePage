"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  Unlink,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface TelegramStatus {
  is_telegram_active: boolean;
  telegram_chat_id?: string;
  has_pending_token?: boolean;
  botUsername?: string;
}

export default function TelegramSettingsCard() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [isAwaitingStart, setIsAwaitingStart] = useState<boolean>(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async (isPolling = false) => {
    if (!isPolling) setIsLoading(true);
    try {
      const res = await fetch("/api/seller/telegram/status", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus(data.data);
        if (data.data.is_telegram_active) {
          setIsAwaitingStart(false);
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          if (isPolling) {
            toast.success("✅ Telegram connected successfully!");
          }
        }
      }
    } catch {
      // ignore transient fetch errors
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [fetchStatus]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/seller/telegram/connect-link", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to generate connection link.");
      }

      // Open Telegram deep link in a new tab
      window.open(data.link, "_blank", "noopener,noreferrer");
      setIsAwaitingStart(true);
      toast.info("Opening Telegram... Press 'Start' in the bot chat to activate.");

      // Poll every 3 seconds for up to 60 seconds
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      let attempts = 0;
      pollTimerRef.current = setInterval(async () => {
        attempts += 1;
        if (attempts > 20) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setIsAwaitingStart(false);
          return;
        }
        await fetchStatus(true);
      }, 3000);
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong while connecting.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const res = await fetch("/api/seller/telegram/test-notification", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send test notification.");
      }

      toast.success(data.message || "Test notification sent! Check your Telegram.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send test alert.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to stop receiving order alerts on Telegram?")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/seller/telegram/disconnect", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to disconnect.");
      }

      toast.success("Telegram alerts disconnected.");
      await fetchStatus();
    } catch (err: any) {
      toast.error(err?.message || "Failed to disconnect Telegram.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const botUsername = status?.botUsername || "StorePageNotifyBot";

  return (
    <Card className="w-full border shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Telegram Notifications</CardTitle>
              <CardDescription>
                Get real-time instant alerts on Telegram whenever a customer places an order.
              </CardDescription>
            </div>
          </div>
          <div>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : status?.is_telegram_active ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1 px-2.5 py-0.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1 px-2.5 py-0.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Not Connected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status explanation */}
        {status?.is_telegram_active ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">
                  Your Telegram is connected to @{botUsername}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Every time an order is received, you will receive customer details, items ordered, and the grand total on your phone.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 h-5 w-5 text-sky-600 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Connect your personal Telegram account
                </p>
                <p className="text-xs">
                  Each moderator, manager, or admin can individually connect their own Telegram account. Clicking connect will launch <b>@{botUsername}</b> with a secure one-time activation link.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Banner shown when waiting for /start */}
        {isAwaitingStart && !status?.is_telegram_active && (
          <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 animate-pulse dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
              <span>Opening Telegram... Press <b>Start</b> in the chat to finish connecting.</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchStatus(true)}
              className="h-7 text-xs"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Check Status
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4">
        {status?.is_telegram_active ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={isTesting}
                className="gap-1.5"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 text-sky-600" />
                )}
                Send Test Notification
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchStatus(false)}
                disabled={isLoading}
                title="Refresh Status"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="gap-1.5"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="h-4 w-4" />
              )}
              Disconnect
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchStatus(false)}
              disabled={isLoading}
              className="text-xs text-muted-foreground"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-sky-600 hover:bg-sky-700 text-white gap-2 shadow-sm"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Connect Telegram Alerts
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

