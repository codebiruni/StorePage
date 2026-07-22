"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Users,
  UserCheck,
  ShieldAlert,
  UserPlus,
} from "lucide-react";

interface UserKpis {
  total: number;
  active: number;
  blocked: number;
  admins: number;
}

const initial: UserKpis = { total: 0, active: 0, blocked: 0, admins: 0 };

export default function UserStats() {
  const [kpis, setKpis] = useState<UserKpis>(initial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/v1/user/manage?page=1&limit=1", {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled && data?.success) {
          const list: any[] = data.data || [];
          setKpis({
            total: data.pagination?.total ?? list.length,
            active: list.filter(
              (u) => u.status !== "blocked" && u.isActive,
            ).length,
            blocked: list.filter((u) => u.status === "blocked").length,
            admins: list.filter(
              (u) => u.role === "admin" || u.role === "super-admin",
            ).length,
          });
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = [
    { label: "Total users", value: kpis.total, icon: Users },
    { label: "Active", value: kpis.active, icon: UserCheck },
    { label: "Blocked", value: kpis.blocked, icon: ShieldAlert },
    { label: "Admins & Super Admins", value: kpis.admins, icon: UserPlus },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <Card key={t.label} className="border-muted">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-2xl font-bold leading-none">{t.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{t.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
