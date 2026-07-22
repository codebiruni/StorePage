"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, UserCheck, Image as ImageIcon, CalendarClock } from "lucide-react";

interface CustomerKpis {
  total: number;
  active: number;
  withImage: number;
  thisWeek: number;
}

const initial: CustomerKpis = {
  total: 0,
  active: 0,
  withImage: 0,
  thisWeek: 0,
};

export default function CustomerStats() {
  const [kpis, setKpis] = useState<CustomerKpis>(initial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/v1/customer?page=1&limit=1", {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled && data?.success) {
          const list = data.data || [];
          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          setKpis({
            total: data.pagination?.total ?? list.length,
            active: list.filter((c: any) => !c.isDeleted).length,
            withImage: list.filter((c: any) => !!c.image).length,
            thisWeek: list.filter(
              (c: any) => new Date(c.createdAt).getTime() >= oneWeekAgo,
            ).length,
          });
        }
      } catch {
        /* swallow; UI shows zero */
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
    { label: "Total customers", value: kpis.total, icon: Users },
    { label: "Active", value: kpis.active, icon: UserCheck },
    { label: "With avatar", value: kpis.withImage, icon: ImageIcon },
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