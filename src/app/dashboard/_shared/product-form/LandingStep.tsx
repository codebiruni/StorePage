"use client";

import LandingPageEditor, {
  type LandingFormValue,
} from "@/app/dashboard/_shared/LandingPageEditor";
import { Separator } from "@/components/ui/separator";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  productId?: string;
  value: LandingFormValue;
  onChange: (next: LandingFormValue) => void;
}

/**
 * Step 3 — Landing page.
 *
 * Every product gets a landing page by default, so this step always shows
 * the editor. The `_useLanding` toggle that previously gated the editor
 * has been removed; the flag is still seeded by `ProductWizard` for
 * backwards compatibility but no longer controls UI state.
 */
export default function LandingStep({ productId, value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <LandingPageEditor
        productId={productId}
        value={value}
        onChange={onChange}
      />

      <Separator />
      <p className="text-xs text-muted-foreground">
        The Copy URL and Preview buttons in the editor only work after the
        product has been saved at least once.
      </p>
    </div>
  );
}
