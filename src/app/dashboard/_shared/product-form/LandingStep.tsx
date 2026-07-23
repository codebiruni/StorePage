"use client";

import LandingPageEditor, {
  EMPTY_LANDING_VALUE,
  type LandingFormValue,
} from "@/app/dashboard/_shared/LandingPageEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Rocket } from "lucide-react";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  productId?: string;
  value: LandingFormValue;
  onChange: (next: LandingFormValue) => void;
}

/**
 * Step 3 — Landing page (off by default).
 *
 * The landing page builder is already a large controlled component, so we
 * keep its state in the parent wizard and just toggle whether the editor is
 * even shown.
 */
export default function LandingStep({ form, productId, value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Landing page</CardTitle>
                <CardDescription>
                  A standalone, single-product sales page at{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    /step/{productId ?? "{productId}"}
                  </code>
                  . Turn this on for products you want to push with ads or
                  influencers.
                </CardDescription>
              </div>
            </div>

            <FormField
              control={form.control}
              name="_useLanding"
              render={({ field }) => (
                <FormItem>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(v) => {
                      field.onChange(v);
                      // When the admin turns the landing page on for the
                      // first time we seed the form with a known-default
                      // shape so the editor has something to render.
                      if (v && !value.theme) {
                        onChange(EMPTY_LANDING_VALUE);
                      }
                    }}
                  />
                </FormItem>
              )}
            />
          </div>
        </CardHeader>
      </Card>

      {form.watch("_useLanding") ? (
        <LandingPageEditor
          productId={productId}
          value={value}
          onChange={onChange}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Landing page is optional. Toggle the switch above to start
              building one — pick a theme, drag sections, see the live
              preview update as you type.
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground">
        The Copy URL and Preview buttons in the editor only work after the
        product has been saved at least once.
      </p>
    </div>
  );
}
