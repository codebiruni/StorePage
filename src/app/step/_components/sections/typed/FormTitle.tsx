"use client";

/**
 * Form Title section — the headline + optional subtitle rendered
 * directly above the system-rendered order form. Lives as a typed section
 * so admins can edit the copy like any other block, but the renderer
 * always positions it immediately above the order form regardless of
 * its position in the editable section list (system-positioned rule,
 * same as the Footer).
 */

import type { FormTitleSectionData } from "@/app/step/_lib/landing-config";

export default function FormTitleSection({
  data,
}: {
  data: FormTitleSectionData;
}) {
  return (
    <div className="lp-container lp-container--narrow pt-8 text-center">
      <h2
        className="lp-headline"
        data-size="xl"
        style={{ color: "var(--lp-primary)" }}
      >
        {data.heading || "অর্ডার করতে নিচের ফর্মটি পূরণ করুন"}
      </h2>
      {data.subheading ? (
        <p className="mt-2 text-sm text-black/70">{data.subheading}</p>
      ) : null}
    </div>
  );
}
