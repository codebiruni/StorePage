import { Card, CardHeader } from "@/components/ui/card";
import React from "react";

interface WorkspaceHeaderProps {
  /** Big page title — e.g. "Product Directory" */
  title: string;
  /** One-line description shown next to the title */
  subtitle?: string;
  /** Pill badges shown beside the divider. Defaults match the workspace styling. */
  badges?: string[];
  /** Right-side action slot — typically a Link/Button or a DialogTrigger.
   *  Pass `null` (or omit) when a workspace has no add/create action. */
  action?: React.ReactNode;
  /** Extra classes for the outer Card — typically used to control top/bottom margin
   *  (e.g. `my-4` for pages that previously used `my-4`). */
  className?: string;
}

/**
 * Shared gradient "hero" card used at the top of every dashboard workspace page.
 * Keeps a single source of truth for the dashboard heading style so adding a new
 * workspace is just `<WorkspaceHeader title=... subtitle=... action=... />`.
 */
export default function WorkspaceHeader({
  title,
  subtitle,
  badges = ["Secure Access", "Admin View"],
  action,
  className = "mt-4",
}: WorkspaceHeaderProps) {
  return (
    <Card
      className={`relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 to-primary/5 ${className}`}
    >
      {/* Decorative blobs — kept identical to the original per-page headers. */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5" />

      <CardHeader className="relative flex flex-col gap-4 justify-between items-start z-10 p-8 sm:flex-row sm:items-center">
        <div className="space-y-2 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-lg text-muted-foreground">{subtitle}</p>
              {badges.length > 0 && (
                <>
                  <div className="h-1 w-8 rounded-full bg-primary/30" />
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {action ? (
          <div className="flex shrink-0 items-center gap-2">{action}</div>
        ) : null}
      </CardHeader>
    </Card>
  );
}
