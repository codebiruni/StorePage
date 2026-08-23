/**
 * ReportPdf.tsx
 * ----------------
 * React-PDF document for the dashboard's monthly + corporate reports.
 *
 * Sections:
 *   1. Cover page              — title, period, generated-on, brand bar.
 *   2. Executive summary       — KPI grid for the chosen report kind.
 *   3. Monthly sales detail    — table, top sellers, category mix,
 *                                payment mix, status mix, trend bars.
 *   4. Corporate overview      — lifetime KPIs, fulfilment health,
 *                                inventory health, top categories, top
 *                                products, payment + status mix, trend.
 *
 * The layout is plain react-pdf primitives (no external chart lib) so it
 * stays fully vector and renders identically across machines without
 * bundling a font registry. The single accent colour is muted indigo to
 * match the dashboard's dark theme.
 */

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

import type {
  MonthlyReport,
  CorporateReport,
  ReportPayload,
} from "./reportData";

/* -------------------------------------------------------------------------- */
/*  Brand palette + sizing                                                    */
/* -------------------------------------------------------------------------- */

const COLORS = {
  ink: "#0F172A",
  inkSoft: "#1F2937",
  muted: "#475569",
  line: "#E2E8F0",
  band: "#F1F5F9",
  page: "#FFFFFF",
  accent: "#4F46E5",
  accentSoft: "#EEF2FF",
  accentDark: "#3730A3",
  positive: "#16A34A",
  warn: "#F59E0B",
  danger: "#DC2626",
};

const PAGE = {
  size: "A4" as const,
  paddingTop: 56,
  paddingBottom: 56,
  paddingHorizontal: 44,
};

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COLORS.ink,
    backgroundColor: COLORS.page,
    paddingTop: PAGE.paddingTop,
    paddingBottom: PAGE.paddingBottom,
    paddingHorizontal: PAGE.paddingHorizontal,
  },

  /* Brand chrome --------------------------------------------------- */
  brandBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLORS.accent,
  },
  footerBar: {
    position: "absolute",
    bottom: 28,
    left: PAGE.paddingHorizontal,
    right: PAGE.paddingHorizontal,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.muted,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.line,
    paddingTop: 6,
  },
  pageNumber: { fontFamily: "Helvetica-Bold" },

  /* Cover ---------------------------------------------------------- */
  coverWrap: { flex: 1, justifyContent: "space-between" },
  coverTop: { marginTop: 80 },
  coverEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.accent,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    lineHeight: 1.15,
  },
  coverSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: 14,
  },
  coverPeriod: {
    fontSize: 13,
    color: COLORS.inkSoft,
    marginTop: 18,
    fontFamily: "Helvetica-Bold",
  },
  coverMeta: {
    flexDirection: "row",
    gap: 24,
    marginTop: 36,
  },
  coverMetaCard: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 6,
    padding: 14,
    minWidth: 180,
  },
  coverMetaLabel: {
    fontSize: 9,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  coverMetaValue: {
    fontSize: 14,
    color: COLORS.accentDark,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
  },
  coverFoot: {
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 14,
    fontSize: 9,
    color: COLORS.muted,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  /* Section heading ------------------------------------------------- */
  section: { marginTop: 14, marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    marginBottom: 6,
  },
  sectionLede: {
    fontSize: 10,
    color: COLORS.muted,
    lineHeight: 1.5,
  },

  /* KPI grid ------------------------------------------------------- */
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  kpiCard: {
    width: "32.2%",
    backgroundColor: COLORS.band,
    borderRadius: 6,
    padding: 12,
  },
  kpiLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  kpiValue: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    marginTop: 6,
  },
  kpiFootnote: { fontSize: 8, color: COLORS.muted, marginTop: 4 },

  /* Tables --------------------------------------------------------- */
  tableWrap: { marginTop: 14 },
  tableTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.inkSoft,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.accentSoft,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: COLORS.accentDark,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
  },
  tableRowAlt: { backgroundColor: COLORS.band },
  tableCell: { fontSize: 9, color: COLORS.ink },
  tableCellRight: { fontSize: 9, color: COLORS.ink, textAlign: "right" },
  tableCellStrong: {
    fontSize: 9,
    color: COLORS.ink,
    fontFamily: "Helvetica-Bold",
  },

  /* Trend bars ----------------------------------------------------- */
  trendBlock: { marginTop: 14 },
  trendTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.inkSoft,
    marginBottom: 6,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  trendLabel: { width: 56, fontSize: 8, color: COLORS.muted },
  trendBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.band,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  trendBarFill: {
    height: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  trendValue: { width: 60, fontSize: 8, textAlign: "right", color: COLORS.ink },

  /* Pills / chips -------------------------------------------------- */
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.accentDark,
    backgroundColor: COLORS.accentSoft,
    alignSelf: "flex-start",
  },
  pillGreen: {
    color: COLORS.positive,
    backgroundColor: "#DCFCE7",
  },
  pillAmber: {
    color: "#92400E",
    backgroundColor: "#FEF3C7",
  },
  pillRed: {
    color: COLORS.danger,
    backgroundColor: "#FEE2E2",
  },
  pillMuted: {
    color: COLORS.muted,
    backgroundColor: COLORS.band,
  },

  /* Two-column block ---------------------------------------------- */
  twoCol: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  col: { flex: 1 },

  /* Small heading ------------------------------------------------- */
  h3: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.inkSoft,
    marginBottom: 4,
    marginTop: 6,
  },
  paragraph: {
    fontSize: 10,
    color: COLORS.inkSoft,
    lineHeight: 1.45,
  },

  /* Generic -------------------------------------------------------- */
  row: { flexDirection: "row", alignItems: "center" },
  spaced: { flexDirection: "row", justifyContent: "space-between" },
  deltaUp: { fontSize: 8, color: COLORS.positive, fontFamily: "Helvetica-Bold" },
  deltaDown: { fontSize: 8, color: COLORS.danger, fontFamily: "Helvetica-Bold" },
  deltaFlat: { fontSize: 8, color: COLORS.muted, fontFamily: "Helvetica-Bold" },
});

/* -------------------------------------------------------------------------- */
/*  Atoms                                                                     */
/* -------------------------------------------------------------------------- */

function fmtBDT(n: number): string {
  // Render as "BDT 12,345" — Helvetica ships with ASCII only.
  return (
    "BDT " +
    Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
  );
}

function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

function Delta({ value }: { value: number }) {
  if (value > 0) return <Text style={styles.deltaUp}>+{fmtPct(value)} MoM</Text>;
  if (value < 0) return <Text style={styles.deltaDown}>{fmtPct(value)} MoM</Text>;
  return <Text style={styles.deltaFlat}>0.0% MoM</Text>;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; style?: object }> = {
    delivered: { label: "Delivered", style: styles.pillGreen },
    cancelled: { label: "Cancelled", style: styles.pillRed },
    pending: { label: "Pending", style: styles.pillAmber },
    confirmed: { label: "Confirmed", style: styles.pillAmber },
    processing: { label: "Processing", style: styles.pillAmber },
    shipped: { label: "Shipped", style: styles.pillAmber },
  };
  const def = { label: status, style: styles.pillMuted };
  const entry = map[status] ?? def;
  return <Text style={[styles.pill, entry.style as any]}>{entry.label}</Text>;
}

function Kpi({
  label,
  value,
  footnote,
}: {
  label: string;
  value: string;
  footnote?: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {footnote ? <Text style={styles.kpiFootnote}>{footnote}</Text> : null}
    </View>
  );
}

function TrendBars({
  data,
}: {
  data: Array<{ label: string; value: number; secondary?: number }>;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View>
      {data.map((row) => {
        const width = (row.value / max) * 100;
        return (
          <View key={row.label} style={styles.trendRow}>
            <Text style={styles.trendLabel}>{row.label}</Text>
            <View style={styles.trendBarTrack}>
              <View style={[styles.trendBarFill, { width: `${width}%` }]} />
            </View>
            <Text style={styles.trendValue}>{row.value.toLocaleString()}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Footer({
  brand,
  pageNumber,
  totalPages,
  generatedAt,
}: {
  brand: string;
  pageNumber: number;
  totalPages: number;
  generatedAt: string;
}) {
  return (
    <View style={styles.footerBar} fixed>
      <Text>{brand} · Confidential</Text>
      <Text>Generated {generatedAt}</Text>
      <Text style={styles.pageNumber}>
        Page {pageNumber} of {totalPages}
      </Text>
    </View>
  );
}

function Brand() {
  return <View style={styles.brandBar} fixed />;
}

/* -------------------------------------------------------------------------- */
/*  Tables                                                                    */
/* -------------------------------------------------------------------------- */

function ColumnHeaders({ widths, headers }: { widths: number[]; headers: string[] }) {
  return (
    <View style={styles.tableHeader}>
      {headers.map((h, i) => (
        <Text
          key={h}
          style={[
            styles.tableHeaderCell,
            { width: `${widths[i]}%`, textAlign: i === 0 ? "left" : "right" },
          ]}
        >
          {h}
        </Text>
      ))}
    </View>
  );
}

interface TblRow {
  cells: Array<{ text: string; strong?: boolean; right?: boolean }>;
  alt?: boolean;
}

function TableRow({ cells, widths, alt }: { cells: TblRow["cells"]; widths: number[]; alt?: boolean }) {
  return (
    <View style={[styles.tableRow, ...(alt ? [styles.tableRowAlt] : [])]}>
      {cells.map((c, i) => (
        <Text
          key={i}
          style={[
            c.right ? styles.tableCellRight : styles.tableCell,
            ...(c.strong ? [styles.tableCellStrong] : []),
            { width: `${widths[i]}%` },
          ]}
        >
          {c.text}
        </Text>
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cover                                                                     */
/* -------------------------------------------------------------------------- */

function CoverPage({
  title,
  subtitle,
  period,
  brand,
  generatedAt,
  preparedFor,
}: {
  title: string;
  subtitle: string;
  period: string;
  brand: string;
  generatedAt: string;
  preparedFor: string;
}) {
  return (
    <Page size={PAGE.size} style={styles.page}>
      <Brand />
      <View style={styles.coverWrap}>
        <View style={styles.coverTop}>
          <Text style={styles.coverEyebrow}>{brand.toUpperCase()} INSIGHTS</Text>
          <Text style={styles.coverTitle}>{title}</Text>
          <Text style={styles.coverSubtitle}>{subtitle}</Text>
          <Text style={styles.coverPeriod}>Reporting Period · {period}</Text>
        </View>

        <View>
          <View style={styles.coverMeta}>
            <View style={styles.coverMetaCard}>
              <Text style={styles.coverMetaLabel}>Prepared For</Text>
              <Text style={styles.coverMetaValue}>{preparedFor}</Text>
            </View>
            <View style={styles.coverMetaCard}>
              <Text style={styles.coverMetaLabel}>Generated On</Text>
              <Text style={styles.coverMetaValue}>{generatedAt}</Text>
            </View>
            <View style={styles.coverMetaCard}>
              <Text style={styles.coverMetaLabel}>Document Type</Text>
              <Text style={styles.coverMetaValue}>
                Executive PDF · auto-generated
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.coverFoot}>
          <Text>{brand} · Internal Sales & Operations Report</Text>
          <Text>v1.0</Text>
        </View>
      </View>
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/*  Monthly section                                                           */
/* -------------------------------------------------------------------------- */

function MonthlyCover({
  report,
  brand,
  preparedFor,
}: {
  report: MonthlyReport;
  brand: string;
  preparedFor: string;
}) {
  const generatedAt = new Date(report.generatedAt);
  const generatedLabel = generatedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <CoverPage
      title={`${report.monthLabel} Sales Report`}
      subtitle="A focused look at order volume, revenue, customers, and category performance for the month."
      period={report.monthLabel}
      brand={brand}
      generatedAt={generatedLabel}
      preparedFor={preparedFor}
    />
  );
}

function MonthlyExecutiveSummary({
  report,
  pageNumber,
  totalPages,
  brand,
}: {
  report: MonthlyReport;
  pageNumber: number;
  totalPages: number;
  brand: string;
}) {
  const { totals, comparison } = report;
  const generatedAt = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const completion = totals.orders
    ? Math.round((totals.deliveredOrders / totals.orders) * 100)
    : 0;

  return (
    <Page size={PAGE.size} style={styles.page}>
      <Brand />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.sectionLede}>
          Headline numbers for {report.monthLabel}. Comparisons are versus the
          prior calendar month. All revenue figures exclude cancelled orders.
        </Text>
      </View>

      <View style={styles.kpiGrid}>
        <Kpi
          label="Revenue"
          value={fmtBDT(totals.revenue)}
          footnote={`vs ${fmtBDT(comparison.priorMonthRevenue)} last month`}
        />
        <Kpi
          label="Orders"
          value={totals.orders.toLocaleString()}
          footnote={`${totals.deliveredOrders} delivered · ${totals.cancelledOrders} cancelled`}
        />
        <Kpi
          label="Avg Order Value"
          value={fmtBDT(totals.avgOrderValue)}
          footnote={`Completion ${completion}%`}
        />
        <Kpi
          label="Units Sold"
          value={totals.unitsSold.toLocaleString()}
          footnote="Across all delivered orders"
        />
        <Kpi
          label="Unique Customers"
          value={totals.uniqueCustomers.toLocaleString()}
          footnote={`${totals.newCustomers} new sign-ups`}
        />
        <Kpi
          label="MoM Revenue"
          value={`${comparison.revenueDeltaPct >= 0 ? "+" : ""}${fmtPct(
            comparison.revenueDeltaPct,
          )}`}
          footnote={`vs ${comparison.priorMonthOrders} prior-month orders`}
        />
      </View>

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Text style={styles.h3}>Performance vs Prior Month</Text>
          <View style={styles.spaced}>
            <Text style={styles.paragraph}>Revenue</Text>
            <Delta value={comparison.revenueDeltaPct} />
          </View>
          <View style={styles.spaced}>
            <Text style={styles.paragraph}>Order Count</Text>
            <Delta value={comparison.ordersDeltaPct} />
          </View>
          <View style={styles.spaced}>
            <Text style={styles.paragraph}>Cancelled</Text>
            <Text style={styles.paragraph}>
              {totals.cancelledOrders.toLocaleString()} orders
            </Text>
          </View>
          <View style={styles.spaced}>
            <Text style={styles.paragraph}>Delivered</Text>
            <Text style={styles.paragraph}>
              {totals.deliveredOrders.toLocaleString()} orders
            </Text>
          </View>
        </View>
        <View style={styles.col}>
          <Text style={styles.h3}>Reading the Report</Text>
          <Text style={styles.paragraph}>
            The pages that follow break {report.monthLabel} into four lenses:
            category contribution, payment-method mix, order-status mix,
            and the top-selling SKUs. A trailing 12-month chart at the end
            of the section puts this month in context.
          </Text>
        </View>
      </View>

      <Footer
        brand={brand}
        pageNumber={pageNumber}
        totalPages={totalPages}
        generatedAt={generatedAt}
      />
    </Page>
  );
}

function MonthlyDetail({
  report,
  pageNumber,
  totalPages,
  brand,
}: {
  report: MonthlyReport;
  pageNumber: number;
  totalPages: number;
  brand: string;
}) {
  const generatedAt = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const catWidths = [44, 16, 22, 18];
  const catHeaders = ["Category", "Orders", "Revenue", "Share"];
  const payWidths = [40, 18, 24, 18];
  const payHeaders = ["Payment Method", "Orders", "Revenue", "Share"];
  const statWidths = [50, 22, 28];
  const statHeaders = ["Status", "Orders", "Share"];
  const topWidths = [38, 28, 14, 20];
  const topHeaders = ["Product", "Category", "Units", "Revenue"];
  const trendWidths = [16, 84];

  return (
    <Page size={PAGE.size} style={styles.page}>
      <Brand />

      {/* --- Top sellers --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{report.monthLabel} · Detail</Text>
        <Text style={styles.sectionLede}>
          The top ten SKUs, category contribution, payment-method mix, and
          order-status mix for the month.
        </Text>
      </View>

      <View style={styles.tableWrap}>
        <Text style={styles.tableTitle}>Top Selling Products</Text>
        <ColumnHeaders widths={topWidths} headers={topHeaders} />
        {report.topProducts.length === 0 ? (
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>No products sold this month.</Text>
          </View>
        ) : (
          report.topProducts.map((p, idx) => (
            <TableRow
              key={`${p.name}-${idx}`}
              alt={idx % 2 === 1}
              widths={topWidths}
              cells={[
                { text: p.name, strong: true },
                { text: p.category },
                { text: p.quantitySold.toLocaleString(), right: true },
                { text: fmtBDT(p.revenue), right: true },
              ]}
            />
          ))
        )}
      </View>

      {/* --- Category + Payment side by side --- */}
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <View style={styles.tableWrap}>
            <Text style={styles.tableTitle}>Category Contribution</Text>
            <ColumnHeaders widths={catWidths} headers={catHeaders} />
            {report.categoryBreakdown.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>No category data.</Text>
              </View>
            ) : (
              report.categoryBreakdown.slice(0, 8).map((c, idx) => (
                <TableRow
                  key={c.category}
                  alt={idx % 2 === 1}
                  widths={catWidths}
                  cells={[
                    { text: c.category, strong: true },
                    { text: c.orders.toLocaleString(), right: true },
                    { text: fmtBDT(c.revenue), right: true },
                    { text: fmtPct(c.sharePct), right: true },
                  ]}
                />
              ))
            )}
          </View>
        </View>
        <View style={styles.col}>
          <View style={styles.tableWrap}>
            <Text style={styles.tableTitle}>Payment Method Mix</Text>
            <ColumnHeaders widths={payWidths} headers={payHeaders} />
            {report.paymentBreakdown.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>No payments captured.</Text>
              </View>
            ) : (
              report.paymentBreakdown.map((p, idx) => (
                <TableRow
                  key={p.method}
                  alt={idx % 2 === 1}
                  widths={payWidths}
                  cells={[
                    { text: p.label, strong: true },
                    { text: p.count.toLocaleString(), right: true },
                    { text: fmtBDT(p.revenue), right: true },
                    { text: fmtPct(p.sharePct), right: true },
                  ]}
                />
              ))
            )}
          </View>
        </View>
      </View>

      {/* --- Status mix --- */}
      <View style={styles.tableWrap}>
        <Text style={styles.tableTitle}>Order Status Mix</Text>
        <ColumnHeaders widths={statWidths} headers={statHeaders} />
        {report.statusBreakdown.map((s, idx) => (
          <TableRow
            key={s.status}
            alt={idx % 2 === 1}
            widths={statWidths}
            cells={[
              { text: s.status.charAt(0).toUpperCase() + s.status.slice(1) },
              { text: s.count.toLocaleString(), right: true },
              { text: fmtPct(s.sharePct), right: true },
            ]}
          />
        ))}
      </View>

      {/* --- Trailing chart --- */}
      <View style={styles.trendBlock}>
        <Text style={styles.trendTitle}>
          Trailing 12 Months · Revenue (BDT)
        </Text>
        <ColumnHeaders widths={trendWidths} headers={["Month", "Revenue"]} />
        <TrendBars
          data={report.trailingMonths.map((m) => ({
            label: m.label,
            value: Math.round(m.revenue),
          }))}
        />
      </View>

      <Footer
        brand={brand}
        pageNumber={pageNumber}
        totalPages={totalPages}
        generatedAt={generatedAt}
      />
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/*  Corporate section                                                         */
/* -------------------------------------------------------------------------- */

function CorporateCover({
  report,
  brand,
  preparedFor,
}: {
  report: CorporateReport;
  brand: string;
  preparedFor: string;
}) {
  const generatedAt = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <CoverPage
      title="Corporate Overview"
      subtitle="Lifetime catalogue, order, fulfilment, and inventory snapshot across the entire business."
      period="Lifetime to date"
      brand={brand}
      generatedAt={generatedAt}
      preparedFor={preparedFor}
    />
  );
}

function CorporateExecutiveSummary({
  report,
  pageNumber,
  totalPages,
  brand,
}: {
  report: CorporateReport;
  pageNumber: number;
  totalPages: number;
  brand: string;
}) {
  const { totals, fulfilment } = report;
  const generatedAt = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Page size={PAGE.size} style={styles.page}>
      <Brand />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Corporate Executive Summary</Text>
        <Text style={styles.sectionLede}>
          Lifetime headline KPIs across products, orders, customers, and
          inventory. Fulfilment rates reflect the share of all-time orders.
        </Text>
      </View>

      <View style={styles.kpiGrid}>
        <Kpi
          label="Lifetime Revenue"
          value={fmtBDT(totals.revenue)}
          footnote={`${totals.orders.toLocaleString()} orders placed`}
        />
        <Kpi
          label="Catalogue"
          value={totals.products.toLocaleString()}
          footnote={`${totals.categories} categories · ${totals.subCategories} sub`}
        />
        <Kpi
          label="Customers"
          value={totals.customers.toLocaleString()}
          footnote={`${totals.branches} active branches`}
        />
        <Kpi
          label="Avg Order Value"
          value={fmtBDT(totals.avgOrderValue)}
          footnote="Excludes cancelled"
        />
        <Kpi
          label="Average Rating"
          value={`${totals.averageRating.toFixed(2)} / 5`}
          footnote={`${totals.reviewCount.toLocaleString()} reviews`}
        />
        <Kpi
          label="Inventory Value"
          value={fmtBDT(totals.inventoryValue)}
          footnote="At current price × stock"
        />
        <Kpi
          label="Delivery Rate"
          value={fmtPct(fulfilment.deliveryRatePct)}
          footnote={`${totals.deliveredOrders.toLocaleString()} delivered`}
        />
        <Kpi
          label="Cancellation Rate"
          value={fmtPct(fulfilment.cancellationRatePct)}
          footnote={`${totals.cancelledOrders.toLocaleString()} cancelled`}
        />
        <Kpi
          label="Pending Share"
          value={fmtPct(fulfilment.pendingRatePct)}
          footnote="Confirmed / processing"
        />
      </View>

      <Footer
        brand={brand}
        pageNumber={pageNumber}
        totalPages={totalPages}
        generatedAt={generatedAt}
      />
    </Page>
  );
}

function CorporateDetail({
  report,
  pageNumber,
  totalPages,
  brand,
}: {
  report: CorporateReport;
  pageNumber: number;
  totalPages: number;
  brand: string;
}) {
  const generatedAt = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const catWidths = [40, 22, 18, 20];
  const catHeaders = ["Category", "Revenue", "Products", "Share"];
  const prodWidths = [40, 26, 14, 20];
  const prodHeaders = ["Product", "Category", "Units", "Revenue"];
  const payWidths = [44, 20, 18, 18];
  const payHeaders = ["Payment", "Orders", "Revenue", "Share"];
  const statWidths = [52, 22, 26];
  const statHeaders = ["Status", "Orders", "Share"];
  const invWidths = [50, 25, 25];
  const invHeaders = ["Bucket", "Range", "Count"];
  const trendWidths = [16, 84];

  return (
    <Page size={PAGE.size} style={styles.page}>
      <Brand />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Corporate · Detail</Text>
        <Text style={styles.sectionLede}>
          Top categories and SKUs, payment & status mix, inventory health,
          and a trailing 12-month revenue trend.
        </Text>
      </View>

      {/* Top categories + Top products side by side */}
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <View style={styles.tableWrap}>
            <Text style={styles.tableTitle}>Top Categories (Lifetime)</Text>
            <ColumnHeaders widths={catWidths} headers={catHeaders} />
            {report.topCategories.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>No category data.</Text>
              </View>
            ) : (
              report.topCategories.map((c, idx) => (
                <TableRow
                  key={c.category}
                  alt={idx % 2 === 1}
                  widths={catWidths}
                  cells={[
                    { text: c.category, strong: true },
                    { text: fmtBDT(c.revenue), right: true },
                    { text: c.productCount.toLocaleString(), right: true },
                    { text: fmtPct(c.sharePct), right: true },
                  ]}
                />
              ))
            )}
          </View>
        </View>
        <View style={styles.col}>
          <View style={styles.tableWrap}>
            <Text style={styles.tableTitle}>Top Products (Lifetime)</Text>
            <ColumnHeaders widths={prodWidths} headers={prodHeaders} />
            {report.topProducts.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>No product data.</Text>
              </View>
            ) : (
              report.topProducts.slice(0, 8).map((p, idx) => (
                <TableRow
                  key={p.name + idx}
                  alt={idx % 2 === 1}
                  widths={prodWidths}
                  cells={[
                    { text: p.name, strong: true },
                    { text: p.category },
                    { text: p.quantitySold.toLocaleString(), right: true },
                    { text: fmtBDT(p.revenue), right: true },
                  ]}
                />
              ))
            )}
          </View>
        </View>
      </View>

      {/* Payment + Status */}
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <View style={styles.tableWrap}>
            <Text style={styles.tableTitle}>Payment Method Mix</Text>
            <ColumnHeaders widths={payWidths} headers={payHeaders} />
            {report.paymentMix.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>No payment data.</Text>
              </View>
            ) : (
              report.paymentMix.map((p, idx) => (
                <TableRow
                  key={p.method}
                  alt={idx % 2 === 1}
                  widths={payWidths}
                  cells={[
                    { text: p.label, strong: true },
                    { text: p.count.toLocaleString(), right: true },
                    { text: fmtPct(p.sharePct), right: true },
                    { text: "", right: true },
                  ]}
                />
              ))
            )}
          </View>
        </View>
        <View style={styles.col}>
          <View style={styles.tableWrap}>
            <Text style={styles.tableTitle}>Order Status Mix</Text>
            <ColumnHeaders widths={statWidths} headers={statHeaders} />
            {report.statusMix.map((s, idx) => (
              <TableRow
                key={s.status}
                alt={idx % 2 === 1}
                widths={statWidths}
                cells={[
                  {
                    text:
                      s.status.charAt(0).toUpperCase() + s.status.slice(1),
                  },
                  { text: s.count.toLocaleString(), right: true },
                  { text: fmtPct(s.sharePct), right: true },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Inventory health */}
      <View style={styles.tableWrap}>
        <Text style={styles.tableTitle}>Inventory Health</Text>
        <ColumnHeaders widths={invWidths} headers={invHeaders} />
        <TableRow
          widths={invWidths}
          cells={[
            { text: "Out of stock", strong: true },
            { text: "0 units", right: true },
            {
              text: report.inventory.outOfStock.toLocaleString(),
              right: true,
              strong: true,
            },
          ]}
        />
        <TableRow
          alt
          widths={invWidths}
          cells={[
            { text: "Low stock", strong: true },
            { text: "1 – 4 units", right: true },
            {
              text: report.inventory.lowStock.toLocaleString(),
              right: true,
              strong: true,
            },
          ]}
        />
        <TableRow
          widths={invWidths}
          cells={[
            { text: "Medium stock", strong: true },
            { text: "5 – 19 units", right: true },
            {
              text: report.inventory.mediumStock.toLocaleString(),
              right: true,
              strong: true,
            },
          ]}
        />
        <TableRow
          alt
          widths={invWidths}
          cells={[
            { text: "Healthy stock", strong: true },
            { text: "20+ units", right: true },
            {
              text: report.inventory.highStock.toLocaleString(),
              right: true,
              strong: true,
            },
          ]}
        />
      </View>

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Text style={styles.h3}>Highest Priced SKU</Text>
          <Text style={styles.paragraph}>
            {report.inventory.highestPriced
              ? `${report.inventory.highestPriced.name} — ${fmtBDT(
                  report.inventory.highestPriced.price,
                )} (${report.inventory.highestPriced.category})`
              : "No products on file."}
          </Text>
          <Text style={[styles.h3, { marginTop: 10 }]}>Lowest Priced SKU</Text>
          <Text style={styles.paragraph}>
            {report.inventory.lowestPriced
              ? `${report.inventory.lowestPriced.name} — ${fmtBDT(
                  report.inventory.lowestPriced.price,
                )} (${report.inventory.lowestPriced.category})`
              : "No products on file."}
          </Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.h3}>Average Catalogue Price</Text>
          <Text style={styles.paragraph}>
            {fmtBDT(report.inventory.averagePrice)} per item.
          </Text>
          <Text style={[styles.h3, { marginTop: 10 }]}>Inventory at Risk</Text>
          <Text style={styles.paragraph}>
            {report.inventory.outOfStock + report.inventory.lowStock} SKUs are
            out-of-stock or below 5 units. Reorder priority should focus on
            categories in the Top Categories table above.
          </Text>
        </View>
      </View>

      {/* Trailing chart */}
      <View style={styles.trendBlock}>
        <Text style={styles.trendTitle}>
          Trailing 12 Months · Revenue (BDT)
        </Text>
        <ColumnHeaders widths={trendWidths} headers={["Month", "Revenue"]} />
        <TrendBars
          data={report.trailingMonths.map((m) => ({
            label: m.label,
            value: Math.round(m.revenue),
          }))}
        />
      </View>

      <Footer
        brand={brand}
        pageNumber={pageNumber}
        totalPages={totalPages}
        generatedAt={generatedAt}
      />
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/*  Document                                                                  */
/* -------------------------------------------------------------------------- */

export interface ReportDocumentProps {
  report: ReportPayload;
  brand?: string;
  preparedFor?: string;
}

export function ReportDocument({
  report,
  brand = "StorePage",
  preparedFor = "Executive Leadership",
}: ReportDocumentProps) {
  // Total pages — fixed by the structure (cover + summary + detail + corporate
  // tail). Page numbers are wired into the footer of the summary + detail pages
  // (the cover is page 1).
  const totalPages = report.kind === "monthly" ? 4 : 5;

  if (report.kind === "monthly") {
    return (
      <Document title={`${report.monthLabel} Sales Report`} author={brand}>
        <MonthlyCover report={report} brand={brand} preparedFor={preparedFor} />
        <MonthlyExecutiveSummary
          report={report}
          pageNumber={2}
          totalPages={totalPages}
          brand={brand}
        />
        <MonthlyDetail
          report={report}
          pageNumber={3}
          totalPages={totalPages}
          brand={brand}
        />
      </Document>
    );
  }

  return (
    <Document title="Corporate Overview" author={brand}>
      <CorporateCover
        report={report}
        brand={brand}
        preparedFor={preparedFor}
      />
      <CorporateExecutiveSummary
        report={report}
        pageNumber={2}
        totalPages={totalPages}
        brand={brand}
      />
      <CorporateDetail
        report={report}
        pageNumber={3}
        totalPages={totalPages}
        brand={brand}
      />
    </Document>
  );
}

/* -------------------------------------------------------------------------- */
/*  Re-export Font for callers that want a custom typeface                    */
/* -------------------------------------------------------------------------- */

export { Font };

/* Suppress unused-style warnings — `StatusPill` is exported for future
 * surface areas (e.g. inline status badges) even if it's not currently
 * rendered in a page. */
export { StatusPill };