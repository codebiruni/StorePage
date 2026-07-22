"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Users,
  UserCheck,
  UserX,
  CalendarClock,
} from "lucide-react";

interface MemberKpis {
  total: number;
  withUser: number;
  deleted: number;
  thisWeek: number;
}

const initial: MemberKpis = {
  total: 0,
  withUser: 0,
  deleted: 0,
  thisWeek: 0,
};

export default function MemberStats() {
  const [kpis, setKpis] = useState<MemberKpis>(initial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/v1/management?page=1&limit=1", {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled && data?.success) {
          const list: any[] = data.data || [];
          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          setKpis({
            total: data.pagination?.total ?? list.length,
            withUser: list.filter((m) => !!m.user).length,
            deleted: list.filter((m) => m.isDeleted).length,
            thisWeek: list.filter(
              (m) => new Date(m.createdAt).getTime() >= oneWeekAgo,
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
    { label: "Total members", value: kpis.total, icon: Users },
    { label: "Linked to a user", value: kpis.withUser, icon: UserCheck },
    { label: "Soft-deleted", value: kpis.deleted, icon: UserX },
    { label: "Added this week", value: kpis.thisWeek, icon: CalendarClock },
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