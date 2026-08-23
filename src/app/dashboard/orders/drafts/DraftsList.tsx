"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Phone, MapPin, RefreshCcw, ExternalLink, Clock } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DraftStatus = "draft" | "abandoned";

interface DraftProduct {
  _id: string;
  name: string;
  images?: string[];
  generalPrice?: { currentPrice: number };
}

interface DraftOrder {
  _id: string;
  orderId: string;
  name?: string;
  number?: string;
  address?: string;
  note?: string;
  grandTotal: number;
  totalAmount: number;
  deliveryCharge: number;
  source?: "landing" | "buy-product" | "manual";
  landingProductId?: string;
  orderStatus: DraftStatus;
  products: DraftProduct[];
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DraftsList() {
  const [status, setStatus] = useState<DraftStatus>("draft");
  const [orders, setOrders] = useState<DraftOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  const fetchDrafts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status,
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const res = await fetch(`/api/order-draft/list?${params}`);
      const json = await res.json();
      if (json?.success) {
        setOrders(json.data || []);
        if (json.pagination) setPagination(json.pagination);
      } else {
        toast.error("Failed to fetch drafts");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching drafts");
    } finally {
      setLoading(false);
    }
  }, [status, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleRecover = (o: DraftOrder) => {
    // Land directly on the edit page where admins can complete the order.
    window.open(`/dashboard/orders/edit/${o._id}`, "_blank");
  };

  const handleCall = (number?: string) => {
    if (!number) return;
    window.location.href = `tel:${number}`;
  };

  const handleWa = (number?: string) => {
    if (!number) return;
    const clean = number.replace(/\D/g, "");
    window.open(`https://wa.me/${clean}`, "_blank");
  };

  const summary = useMemo(() => {
    return {
      total: pagination.total,
      withPhone: orders.filter((o) => (o.number || "").trim().length > 0).length,
    };
  }, [orders, pagination.total]);

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Incomplete Orders</CardTitle>
            <Badge variant="secondary">{pagination.total}</Badge>
            <Badge variant="outline" className="text-green-700">
              {summary.withPhone} w/ phone
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(v: DraftStatus) => {
                setStatus(v);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Drafts (active)</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDrafts}
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No {status} orders. 🎉
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{o.name || <em className="text-muted-foreground">unknown</em>}</span>
                        {o.orderStatus === "abandoned" ? (
                          <Badge variant="destructive" className="text-xs">abandoned</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">draft</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{o.orderId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{o.number || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.products?.length || 0} item{(o.products?.length || 0) === 1 ? "" : "s"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      {o.address ? (
                        <div className="flex items-start gap-1 text-sm">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                          <span className="line-clamp-2">{o.address}</span>
                        </div>
                      ) : (
                        <em className="text-muted-foreground">—</em>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {o.source || "manual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ৳{(o.grandTotal || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {timeAgo(o.lastActivityAt || o.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCall(o.number)}
                          disabled={!o.number}
                          title="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWa(o.number)}
                          disabled={!o.number}
                          title="WhatsApp"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleRecover(o)}
                          title="Recover / edit"
                        >
                          <RefreshCcw className="h-4 w-4 mr-1" />
                          Recover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                Prev
              </Button>
              <span className="text-sm text-muted-foreground self-center">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Tip: drafts auto-promote to <code>pending</code> when the user finishes checkout.
        Use the cron route <code>POST /api/order-draft/abandoned</code> with{" "}
        <code>CRON_SECRET</code> to flag stale drafts as abandoned.
      </p>
    </div>
  );
}