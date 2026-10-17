/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Star,
  ShoppingCart,
  BarChart3,
  Target,
  Download,
  RefreshCw,
  FileText,
  Loader2,
  Zap,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

// ─── Types ──────────────────────────────────────────────────────────────────

interface InventoryData {
  overview: {
    totalProducts: number
    totalInventoryValue: number
    lowStockProducts: number
    outOfStockProducts: number
    totalCategories: number
    totalSubCategories: number
    averageRating: number
  }
  stockAnalysis: {
    stockLevels: Array<{
      level: string
      count: number
      percentage: number
      value: number
    }>
    criticalProducts: Array<{
      _id: string
      name: string
      quentity: number
      currentPrice: number
      category: string
      stockValue: number
    }>
  }
  categoryAnalysis: Array<{
    category: string
    productCount: number
    totalValue: number
    averagePrice: number
    lowStockCount: number
    percentage: number
  }>
  priceAnalysis: {
    priceRanges: Array<{ range: string; count: number; percentage: number }>
    averageProductPrice: number
    highestPricedProduct: { name: string; price: number; category: string }
    lowestPricedProduct: { name: string; price: number; category: string }
  }
  salesPerformance: {
    topSellingProducts: Array<{
      productId: string
      name: string
      salesCount: number
      revenue: number
      quantitySold: number
    }>
    categorySales: Array<{
      category: string
      salesCount: number
      revenue: number
      percentage: number
    }>
  }
  productPerformance: {
    bestRatedProducts: Array<{
      name: string
      averageRating: number
      reviewCount: number
      price: number
      category: string
    }>
    mostReviewedProducts: Array<{
      name: string
      reviewCount: number
      averageRating: number
      category: string
    }>
  }
  inventoryTrends: {
    monthlyInventoryChange: Array<{
      month: string
      productsAdded: number
      inventoryValueChange: number
      stockMovement: number
    }>
    categoryGrowth: Array<{
      category: string
      growthRate: number
      newProducts: number
    }>
  }
  recentActivity: {
    lowStockAlerts: Array<{
      product: string
      quantity: number
      category: string
      urgency: string
    }>
    recentRestocks: Array<{
      product: string
      previousQuantity: number
      newQuantity: number
      date: string
    }>
    newProducts: Array<{
      name: string
      category: string
      price: number
      createdAt: string
    }>
  }
  orderInsights: {
    totals: {
      totalOrders: number
      totalRevenue: number
      averageOrderValue: number
      cancelledOrders: number
      deliveredOrders: number
      pendingOrders: number
    }
    statusBreakdown: Array<{ status: string; count: number; percentage: number }>
    paymentBreakdown: Array<{ method: string; count: number; percentage: number }>
    monthlyOrders: Array<{ month: string; orders: number; revenue: number }>
    sourceBreakdown: Array<{ source: string; count: number; percentage: number }>
    recentOrders: Array<{
      orderId: string
      name: string
      number: string
      grandTotal: number
      orderStatus: string
      paymentStatus: string
      paymentMethod: string
      createdAt: string
    }>
  }
}

// ─── Colour tokens ───────────────────────────────────────────────────────────

const STOCK_COLORS: Record<string, string> = {
  'Out of Stock': '#ef4444',
  Critical: '#f97316',
  Low: '#eab308',
  Medium: '#22c55e',
  High: '#15803d',
}

const CATEGORY_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#3b82f6',
]

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#6366f1',
  shipped: '#0ea5e9',
  delivered: '#16a34a',
  cancelled: '#ef4444',
}

const ORDER_STATUS_PILL: Record<string, string> = {
  pending:    'bg-amber-50  text-amber-700  border-amber-200  dark:bg-amber-950/40  dark:text-amber-400  dark:border-amber-800',
  confirmed:  'bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-950/40   dark:text-blue-400   dark:border-blue-800',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
  shipped:    'bg-sky-50    text-sky-700    border-sky-200    dark:bg-sky-950/40    dark:text-sky-400    dark:border-sky-800',
  delivered:  'bg-green-50  text-green-700  border-green-200  dark:bg-green-950/40  dark:text-green-400  dark:border-green-800',
  cancelled:  'bg-red-50    text-red-700    border-red-200    dark:bg-red-950/40    dark:text-red-400    dark:border-red-800',
}

const PAYMENT_STATUS_PILL: Record<string, string> = {
  paid:     'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800',
  pending:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  failed:   'bg-red-50   text-red-700   border-red-200   dark:bg-red-950/40   dark:text-red-400   dark:border-red-800',
  refunded: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-800',
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  'cash-on-delivery': 'Cash on Delivery',
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  card: 'Card',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent: string   // tailwind gradient classes e.g. "from-indigo-500 to-violet-600"
  danger?: boolean
}

function KpiCard({ label, value, sub, icon, accent, danger }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300 min-w-0">
      {/* subtle top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />
      <div className="p-3.5 sm:p-5 min-w-0">
        <div className="flex items-start justify-between gap-1.5 min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate" title={label}>{label}</p>
          <span className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br ${accent} text-white shadow-xs`}>
            {icon}
          </span>
        </div>
        <p
          className={`mt-2 sm:mt-3 text-lg sm:text-2xl font-bold tracking-tight truncate ${danger ? 'text-red-500' : 'text-foreground'}`}
          title={value}
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-1" title={sub}>{sub}</p>}
      </div>
    </div>
  )
}

interface SectionCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

function SectionCard({ title, description, icon, children, className = '', action }: SectionCardProps) {
  return (
    <div className={`rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="text-muted-foreground">{icon}</span>
          )}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function StatusPill({ status, map }: { status: string; map: Record<string, string> }) {
  const cls = map[status] ?? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-800'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function DashboardInventory() {
  const [data, setData] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [reportType, setReportType] = useState<'monthly' | 'corporate' | null>(null)

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/inventory?range=${timeRange}`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error(result.message || 'Failed to fetch inventory data')
      }
    } catch (error) {
      toast.error('Error fetching inventory data')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async () => {
    try {
      setReportType('monthly')
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'monthly',
          month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).error || `Request failed (${res.status})`)
      }
      const contentType = res.headers.get('Content-Type') || ''
      if (!contentType.includes('application/pdf')) throw new Error('Server did not return a PDF.')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="([^"]+)"/i)
      a.download = match?.[1] ?? `monthly-sales-${new Date().toISOString().slice(0, 7)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Monthly Sales PDF downloaded.')
    } catch (err) {
      console.error('Report export failed:', err)
      toast.error(err instanceof Error ? err.message : 'Report export failed')
    } finally {
      setReportType(null)
    }
  }

  useEffect(() => {
    fetchInventoryData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  // ── Formatters ──────────────────────────────────────────────────────────────

  const fmt = (amount: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount)

  const fmtNum = (n: number) => new Intl.NumberFormat().format(n)

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return iso
    }
  }

  const getPaymentMethodLabel = (m: string) => PAYMENT_METHOD_LABEL[m] ?? m

  // ── Chart datasets ───────────────────────────────────────────────────────────

  const monthlyTrendsData = data?.inventoryTrends.monthlyInventoryChange ?? []
  const salesCategoryData = data?.salesPerformance.categorySales.slice(0, 6) ?? []
  const topSellingProducts = data?.salesPerformance.topSellingProducts.slice(0, 5) ?? []
  const bestRatedProducts = data?.productPerformance.bestRatedProducts.slice(0, 5) ?? []
  const stockLevelData = data?.stockAnalysis.stockLevels ?? []
  const priceRangeData = data?.priceAnalysis.priceRanges ?? []

  const areaChartData = monthlyTrendsData.map((item) => ({
    name: item.month,
    Products: item.productsAdded,
    Value: Math.round(item.inventoryValueChange / 1000),
  }))

  const pieChartData = priceRangeData.map((r) => ({ name: r.range, value: r.count }))

  const barChartData = topSellingProducts.map((p) => ({
    name: p.name.length > 14 ? p.name.substring(0, 14) + '…' : p.name,
    Sales: p.salesCount,
    Revenue: p.revenue,
  }))

  const orderInsights = data?.orderInsights
  const orderTotals = orderInsights?.totals
  const monthlyOrdersData = orderInsights?.monthlyOrders ?? []
  const statusBreakdownData = orderInsights?.statusBreakdown ?? []
  const paymentBreakdownData = orderInsights?.paymentBreakdown ?? []
  const recentOrdersData = orderInsights?.recentOrders ?? []

  const ordersTrendData = monthlyOrdersData.map((r) => ({
    name: r.month,
    Orders: r.orders,
    Revenue: Math.round(r.revenue / 1000),
  }))

  const orderStatusPieData = statusBreakdownData.map((r) => ({
    name: r.status,
    value: r.count,
    fill: ORDER_STATUS_COLORS[r.status] ?? '#3b82f6',
  }))

  // ── Custom tooltip ───────────────────────────────────────────────────────────

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-xl border border-border bg-popover px-3 py-2.5 shadow-xl text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="leading-5">
            {entry.name}:{' '}
            {entry.name === 'Revenue' || entry.name === 'Value'
              ? `${fmtNum(entry.value)}K BDT`
              : fmtNum(entry.value)}
          </p>
        ))}
      </div>
    )
  }

  // ── Loading / empty states ───────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-semibold">No data available</p>
            <p className="text-sm text-muted-foreground">Unable to load inventory data</p>
          </div>
          <Button size="sm" onClick={fetchInventoryData}>
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-10">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time inventory, sales &amp; order intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: '7d' | '30d' | '90d') => setTimeRange(v)}>
            <SelectTrigger className="h-9 w-32 text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 rounded-lg text-xs"
            onClick={fetchInventoryData}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-lg text-xs"
            disabled={reportType !== null}
            onClick={handleExportReport}
          >
            {reportType ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <FileText className="h-3.5 w-3.5" />
            Monthly Report
          </Button>
        </div>
      </div>

      {/* ── Inventory KPI row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
        <KpiCard
          label="Total Products"
          value={fmtNum(data.overview.totalProducts)}
          sub={`${data.overview.totalCategories} categories · ${data.overview.totalSubCategories} sub-categories`}
          icon={<Package className="h-4 w-4" />}
          accent="from-indigo-500 to-violet-600"
        />
        <KpiCard
          label="Inventory Value"
          value={fmt(data.overview.totalInventoryValue)}
          sub={`Avg price ${fmt(data.priceAnalysis.averageProductPrice)}`}
          icon={<DollarSign className="h-4 w-4" />}
          accent="from-emerald-500 to-teal-600"
        />
        <KpiCard
          label="Stock Alerts"
          value={String(data.overview.lowStockProducts + data.overview.outOfStockProducts)}
          sub={`${data.overview.outOfStockProducts} out of stock · ${data.overview.lowStockProducts} low`}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="from-orange-500 to-red-500"
          danger
        />
        <KpiCard
          label="Avg Rating"
          value={`${data.overview.averageRating.toFixed(1)} / 5`}
          sub="Based on product reviews"
          icon={<Star className="h-4 w-4" />}
          accent="from-amber-400 to-orange-500"
        />
      </div>

      {/* ── Orders KPI row ────────────────────────────────────────────────────── */}
      {orderTotals && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
          <KpiCard
            label="Total Orders"
            value={fmtNum(orderTotals.totalOrders)}
            sub={`${orderTotals.pendingOrders} pending · ${orderTotals.deliveredOrders} delivered`}
            icon={<ShoppingCart className="h-4 w-4" />}
            accent="from-sky-500 to-blue-600"
          />
          <KpiCard
            label="Total Revenue"
            value={fmt(orderTotals.totalRevenue)}
            sub={`${orderTotals.cancelledOrders} cancelled orders`}
            icon={<DollarSign className="h-4 w-4" />}
            accent="from-green-500 to-emerald-600"
          />
          <KpiCard
            label="Avg Order Value"
            value={fmt(orderTotals.averageOrderValue)}
            sub="Excluding cancelled orders"
            icon={<TrendingUp className="h-4 w-4" />}
            accent="from-pink-500 to-rose-600"
          />
          <KpiCard
            label="Top Payment"
            value={paymentBreakdownData.length > 0 ? getPaymentMethodLabel(paymentBreakdownData[0].method) : '—'}
            sub={
              paymentBreakdownData.length > 0
                ? `${fmtNum(paymentBreakdownData[0].count)} orders · ${paymentBreakdownData[0].percentage.toFixed(0)}%`
                : undefined
            }
            icon={<Tag className="h-4 w-4" />}
            accent="from-purple-500 to-indigo-600"
          />
        </div>
      )}

      {/* ── Chart row 1 – Orders & Inventory trends ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Orders Trend"
          description="Monthly order volume and revenue"
          icon={<TrendingUp className="h-4 w-4" />}
        >
          {ordersTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ordersTrendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Orders" stroke="#3b82f6" strokeWidth={2} fill="url(#gOrders)" dot={false} />
                <Area type="monotone" dataKey="Revenue" stroke="#16a34a" strokeWidth={2} fill="url(#gRevenue)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </SectionCard>

        <SectionCard
          title="Inventory Trends"
          description="Monthly products added and value changes"
          icon={<BarChart3 className="h-4 w-4" />}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaChartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gProducts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Products" stroke="#6366f1" strokeWidth={2} fill="url(#gProducts)" dot={false} />
              <Area type="monotone" dataKey="Value" stroke="#10b981" strokeWidth={2} fill="url(#gValue)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* ── Chart row 2 – Top sellers bar + Order status donut ───────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-3"
          title="Top Selling Products"
          description="By sales count"
          icon={<ShoppingCart className="h-4 w-4" />}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barChartData} margin={{ top: 4, right: 4, left: -16, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="Sales" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          title="Order Status"
          description="Fulfillment breakdown"
          icon={<Target className="h-4 w-4" />}
        >
          {orderStatusPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={orderStatusPieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                    {orderStatusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${fmtNum(Number(v))} orders`, String(name)]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {orderStatusPieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="capitalize text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-semibold">{fmtNum(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart />
          )}
        </SectionCard>
      </div>

      {/* ── Row 3 – Price range pie + Stock levels ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Price Range Distribution"
          description="Products across price tiers"
          icon={<Tag className="h-4 w-4" />}
        >
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                outerRadius={75}
                dataKey="value"
              >
                {pieChartData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [fmtNum(Number(v)) + ' products', String(name)]} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend list — no overlap risk */}
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {pieChartData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                <span className="text-muted-foreground truncate">{item.name}</span>
                <span className="ml-auto font-semibold">{fmtNum(item.value)}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Stock Level Breakdown"
          description="Count and value by stock status"
          icon={<Package className="h-4 w-4" />}
        >
          <div className="space-y-3">
            {stockLevelData.map((level) => (
              <div key={level.level}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STOCK_COLORS[level.level] }}
                    />
                    <span className="font-medium">{level.level}</span>
                    <span className="text-muted-foreground">({level.count})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{level.percentage.toFixed(1)}%</span>
                    <span className="text-muted-foreground ml-2">{fmt(level.value)}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${level.percentage}%`, backgroundColor: STOCK_COLORS[level.level] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Row 4 – Detail cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

        {/* Critical stock alerts */}
        <SectionCard
          title="Critical Stock"
          description="Needs immediate attention"
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        >
          <div className="space-y-2">
            {data.stockAnalysis.criticalProducts.slice(0, 5).map((p) => (
              <div key={p._id} className="flex items-center justify-between rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${p.quentity === 0 ? 'bg-red-500' : 'bg-orange-500'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.category}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className={`text-xs font-bold ${p.quentity === 0 ? 'text-red-600' : 'text-orange-600'}`}>{p.quentity} left</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Category performance */}
        <SectionCard
          title="Category Performance"
          description="Revenue by category"
          icon={<Target className="h-4 w-4" />}
        >
          <div className="space-y-3.5">
            {salesCategoryData.slice(0, 5).map((cat, i) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    <span className="font-medium truncate max-w-[100px]">{cat.category}</span>
                  </div>
                  <span className="font-semibold">{fmt(cat.revenue)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.percentage}%`, backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Best rated & new products */}
        <SectionCard
          title="Top Rated Products"
          description="Highest rated by customers"
          icon={<Zap className="h-4 w-4" />}
        >
          <div className="space-y-2">
            {bestRatedProducts.slice(0, 4).map((p, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg border border-border/50 p-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 shrink-0">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold">{p.averageRating.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">{p.reviewCount} reviews</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Recent orders */}
        <SectionCard
          title="Recent Orders"
          description="Latest across all channels"
          icon={<ShoppingCart className="h-4 w-4" />}
        >
          {recentOrdersData.length > 0 ? (
            <div className="space-y-2">
              {recentOrdersData.map((order, i) => (
                <div key={`${order.orderId}-${i}`} className="rounded-lg border border-border/50 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[10px] font-semibold text-muted-foreground truncate">{order.orderId}</p>
                    <StatusPill status={order.orderStatus} map={ORDER_STATUS_PILL} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{order.name}</p>
                      <p className="text-[10px] text-muted-foreground">{getPaymentMethodLabel(order.paymentMethod)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold">{fmt(order.grandTotal)}</p>
                      <StatusPill status={order.paymentStatus} map={PAYMENT_STATUS_PILL} />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{fmtDate(order.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No orders yet</p>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      No data for the selected period
    </div>
  )
}