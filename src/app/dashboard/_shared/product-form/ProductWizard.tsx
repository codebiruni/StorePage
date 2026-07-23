"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, type FieldValues } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import DetailsStep from "./DetailsStep";
import LandingStep from "./LandingStep";
import PricingStep from "./PricingStep";
import {
  PRODUCT_FORM_STEPS,
  STEP_DESCRIPTIONS,
  STEP_LABELS,
  defaultProductValues,
  type ProductFormData,
  type ProductFormStep,
} from "./types";
import type { LandingFormValue } from "@/app/dashboard/_shared/LandingPageEditor";

/**
 * Map the API's nested landing-page shape (`ILandingPage`) onto the editor's
 * flat `LandingFormValue`. Without this, every comparison / hero field
 * appears empty in the form even when the database has values — because the
 * editor reads `value.comparisonOursTitle` while the API sends
 * `value.comparison.oursTitle`. Saving an empty form then overwrites the
 * real values in Mongo, which is how the comparison block stopped
 * persisting in the first place.
 *
 * The typed-section view (`sections[]`, `primaryColor`, `accentColor`) is
 * carried through verbatim when present, so opening the editor on a
 * product that was saved with the unified section builder does NOT fall
 * back to the legacy projection — every section the admin added survives
 * a round-trip through the wizard.
 */
function toLandingFormValue(
  src: Partial<LandingFormValue> | null | undefined,
): LandingFormValue {
  const flat = (src ?? {}) as Partial<LandingFormValue> & {
    comparison?: {
      oursTitle?: string;
      oursItems?: string[];
      othersTitle?: string;
      othersItems?: string[];
    };
    sections?: LandingFormValue["sections"];
    primaryColor?: string;
    accentColor?: string;
    updatedAt?: string;
  };
  // Treat a nested `comparison.*` as authoritative — only fall back to the
  // flat keys when the nested object isn't present (e.g. partial editor
  // values handed back from onChange before the user reaches that field).
  const cmp = flat.comparison;
  // Forward the typed-section view when present. These are owned by the
  // unified `SectionEditorPanel`; discarding them here would silently
  // downgrade a saved product back to the legacy projection on next edit.
  const sections = Array.isArray(flat.sections) ? flat.sections : undefined;
  const primaryColor =
    typeof flat.primaryColor === "string" && flat.primaryColor.length > 0
      ? flat.primaryColor
      : undefined;
  const accentColor =
    typeof flat.accentColor === "string" && flat.accentColor.length > 0
      ? flat.accentColor
      : undefined;
  return {
    theme: (flat.theme as LandingFormValue["theme"]) ?? "health",
    heroTitle: flat.heroTitle ?? "",
    heroSubtitle: flat.heroSubtitle ?? "",
    heroBadge: flat.heroBadge ?? "",
    heroCtaLabel: flat.heroCtaLabel ?? "",
    painPoints: flat.painPoints ?? [],
    benefits: flat.benefits ?? [],
    howToUse: flat.howToUse ?? [],
    guarantee: flat.guarantee ?? "",
    trustBadges: flat.trustBadges ?? [],
    vslUrl: flat.vslUrl ?? "",
    youtubeUrl: flat.youtubeUrl ?? "",
    checkoutNote: flat.checkoutNote ?? "",
    comparisonOursTitle:
      cmp?.oursTitle ?? flat.comparisonOursTitle ?? "",
    comparisonOursItems:
      cmp?.oursItems ?? flat.comparisonOursItems ?? [],
    comparisonOthersTitle:
      cmp?.othersTitle ?? flat.comparisonOthersTitle ?? "",
    comparisonOthersItems:
      cmp?.othersItems ?? flat.comparisonOthersItems ?? [],
    phoneStripNote: flat.phoneStripNote ?? "",
    ...(sections ? { sections } : null),
    ...(primaryColor ? { primaryColor } : null),
    ...(accentColor ? { accentColor } : null),
  };
}

export type ProductWizardMode = "create" | "edit";

interface BaseProps {
  mode: ProductWizardMode;
  /** Pre-fill values (used by edit flow after fetching). */
  initialData?: Partial<ProductFormData> | null;
  /** Existing product id — required in edit mode for PATCH + landing URL. */
  productId?: string;
  /** Heading shown above the wizard. */
  heading?: string;
  /** Subheading under the heading. */
  subheading?: string;
}

type CreateProps = BaseProps & {
  mode: "create";
  productId?: undefined;
};

type EditProps = BaseProps & {
  mode: "edit";
  productId: string;
};

type Props = CreateProps | EditProps;

/** Flatten the discriminated union so TS can statically see props. */
type DiscriminatedProps =
  | (CreateProps & { productId?: undefined })
  | (EditProps & { initialData?: Partial<ProductFormData> | null });

/**
 * 3-step product wizard shared by create + edit pages.
 *
 * Step state, validation gating and the "unsaved changes" guard live here so
 * the page wrappers stay tiny. The actual API call happens in onSave which is
 * passed in by the wrapper so we can keep fetch logic out of the wizard.
 */
export interface ProductWizardHandle {
  values: ProductFormData;
  landingValue: LandingFormValue;
}

export type ProductWizardProps = DiscriminatedProps & {
  onSave: (payload: {
    values: ProductFormData;
    landingValue: LandingFormValue;
    mode: ProductWizardMode;
    productId?: string;
  }) => Promise<{ ok: boolean; error?: string; productId?: string }>;
}

export default function ProductWizard(props: ProductWizardProps) {
  const { onSave, mode, productId, initialData, heading, subheading } = props;
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [landingValue, setLandingValue] = useState<LandingFormValue>(
    () => toLandingFormValue(initialData?.landingPage),
  );

  const form = useForm<ProductFormData>({
    defaultValues: useMemo(() => {
      const base = defaultProductValues();
      // Seed UI flags from any existing data so the toggles reflect reality.
      const merged: ProductFormData & Record<string, unknown> = {
        ...base,
        ...(initialData ?? {}),
      };
      merged._useVariants =
        Array.isArray(initialData?.priceVariants) &&
        initialData!.priceVariants.length > 0;
      merged._useCoupons =
        Array.isArray(initialData?.coupon) && initialData!.coupon.length > 0;
      merged._useOffers = !!initialData?.hasOffer;
      merged._useLanding = !!initialData?.landingPage?.theme;
      return merged as ProductFormData;
    }, [initialData]),
    mode: "onTouched",
  });

  // Re-seed the form whenever the parent supplies new initial data
  // (e.g. after the edit page fetches from the API, or after a save
  // re-fetches the latest server state). Only apply the seed when the
  // form is NOT dirty — otherwise we'd clobber the user's in-progress
  // edits every time the parent re-fetches.
  const lastSeededRef = useRef<unknown>(null);
  useEffect(() => {
    if (mode !== "edit") return;
    if (!initialData) return;
    // Skip if we already seeded from this exact object (and nothing dirty).
    if (lastSeededRef.current === initialData) return;
    if (form.formState.isDirty) {
      // User is mid-edit; remember the value so we don't keep retrying.
      lastSeededRef.current = initialData;
      return;
    }
    lastSeededRef.current = initialData;
    form.reset({
      ...defaultProductValues(),
      ...initialData,
      _useVariants:
        Array.isArray(initialData.priceVariants) &&
        initialData.priceVariants.length > 0,
      _useCoupons:
        Array.isArray(initialData.coupon) && initialData.coupon.length > 0,
      _useOffers: !!initialData.hasOffer,
      _useLanding: !!initialData.landingPage?.theme,
    } as ProductFormData);
    if (initialData.landingPage) {
      setLandingValue(toLandingFormValue(initialData.landingPage));
    }
  }, [mode, initialData, form]);

  // ── Live preview values (sticky right-rail card) ────────────────────
  const previewName = form.watch("name") || "Untitled product";
  const previewImage = (form.watch("images") as string[] | undefined)?.[0];
  const previewPrice = form.watch("generalPrice.currentPrice") || 0;
  const previewPrev = form.watch("generalPrice.prevPrice") || 0;
  const previewDiscount = form.watch("generalPrice.discountPercentage") || 0;

  const currentStep: ProductFormStep = PRODUCT_FORM_STEPS[stepIndex];

  // ── Field-level gating for the Next button ──────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stepFields: Record<ProductFormStep, any[]> = {
    details: ["name", "details", "category", "images"],
    pricing: ["generalPrice.currentPrice", "generalPrice.prevPrice", "stock"],
    landing: [],
  };

  const goNext = async () => {
    const ok = await form.trigger(stepFields[currentStep] as FieldValues["_paths"][number][] as never);
    if (!ok) return;
    setStepIndex((i) => Math.min(i + 1, PRODUCT_FORM_STEPS.length - 1));
  };

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleSave = async () => {
    // Final validation — we don't require landing fields, so only enforce
    // details + pricing here.
    const valid = await form.trigger([
      ...stepFields.details,
      ...stepFields.pricing,
    ] as never);
    if (!valid) {
      // Surface the user to whichever step contains the error.
      const errors = form.formState.errors;
      if (errors.name || errors.details || errors.category || errors.images) {
        setStepIndex(0);
      } else if (
        errors.generalPrice?.currentPrice ||
        errors.generalPrice?.prevPrice ||
        errors.stock
      ) {
        setStepIndex(1);
      }
      toast.error("Please fix the highlighted fields before saving");
      return;
    }

    setIsSaving(true);
    try {
      // Strip UI-only flags before sending.
      const raw = form.getValues();
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _useVariants: _a,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _useOffers: _b,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _useCoupons: _c,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _useLanding: _d,
        ...values
      } = raw as ProductFormData & Record<string, unknown>;

      const result = await onSave({
        values: values as ProductFormData,
        landingValue,
        mode,
        productId,
      });
      if (!result.ok) {
        toast.error(result.error || "Save failed");
        return;
      }
      setSavedAt(new Date());
      form.reset(form.getValues()); // clears dirty state
      toast.success(
        mode === "create" ? "Product created" : "Changes saved",
      );
      if (mode === "create" && result.productId) {
        router.push(`/dashboard/products/edit/${result.productId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!initialData) {
      form.reset(defaultProductValues());
      setLandingValue({} as LandingFormValue);
      return;
    }
    form.reset({
      ...defaultProductValues(),
      ...initialData,
      _useVariants:
        Array.isArray(initialData.priceVariants) &&
        initialData.priceVariants.length > 0,
      _useCoupons:
        Array.isArray(initialData.coupon) && initialData.coupon.length > 0,
      _useOffers: !!initialData.hasOffer,
      _useLanding: !!initialData.landingPage?.theme,
    } as ProductFormData);
    if (initialData.landingPage) {
      setLandingValue(toLandingFormValue(initialData.landingPage));
    }
    toast.success("Reverted to last saved values");
  };

  // Warn before unloading the page if there are unsaved changes.
  const isDirty = form.formState.isDirty;
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return (
    <FormProvider {...form}>
      <div className="container mx-auto max-w-7xl py-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {heading ?? (mode === "create" ? "Add new product" : "Edit product")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {subheading ??
                (mode === "create"
                  ? "Three short steps. Save anytime — your draft is kept on this device."
                  : "Update details, pricing, or the landing page. Save when you're done.")}
            </p>
          </div>
          {savedAt && (
            <Badge variant="outline" className="gap-1 text-emerald-600">
              <Check className="h-3 w-3" /> Saved {savedAt.toLocaleTimeString()}
            </Badge>
          )}
        </div>

        {/* ── Stepper ───────────────────────────────────────────────── */}
        <ol className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PRODUCT_FORM_STEPS.map((step, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <li key={step}>
                <button
                  type="button"
                  onClick={() => setStepIndex(i)}
                  className={cn(
                    "group w-full rounded-lg border p-4 text-left transition-colors",
                    active && "border-primary bg-primary/5",
                    done && "border-emerald-300 bg-emerald-50/50",
                    !active && !done && "hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                        active && "border-primary bg-primary text-primary-foreground",
                        done && "border-emerald-500 bg-emerald-500 text-white",
                        !active && !done && "border-muted-foreground/40 text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          active ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {STEP_LABELS[step]}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {STEP_DESCRIPTIONS[step]}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        <div
          className={cn(
            "grid gap-6",
            currentStep === "landing"
              ? "lg:grid-cols-1"
              : "lg:grid-cols-[1fr_320px]",
          )}
        >
          {/* ── Main column ──────────────────────────────────────────── */}
          <div className="min-w-0 space-y-6">
            {isDirty && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>Unsaved changes</AlertTitle>
                <AlertDescription>
                  You have unsaved edits. Use Save to publish them, or Reset to
                  revert.
                </AlertDescription>
              </Alert>
            )}

            {currentStep === "details" && <DetailsStep form={form} />}
            {currentStep === "pricing" && <PricingStep form={form} />}
            {currentStep === "landing" && (
              <LandingStep
                form={form}
                productId={productId}
                value={landingValue}
                onChange={setLandingValue}
              />
            )}

            <Separator />

            {/* ── Footer nav ─────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goBack}
                  disabled={stepIndex === 0 || isSaving}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                {stepIndex < PRODUCT_FORM_STEPS.length - 1 ? (
                  <Button type="button" onClick={goNext} disabled={isSaving}>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving || (!isDirty && mode === "edit")}
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  {mode === "create" ? "Clear" : "Reset changes"}
                </Button>
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {mode === "create" ? "Create product" : "Save changes"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ── Live preview card ────────────────────────────────────── */}
          <aside
            className={cn(
              "hidden lg:block",
              currentStep === "landing" && "hidden",
            )}
          >
            <div className="sticky top-6 space-y-3">
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Live preview
                  </CardTitle>
                  <CardDescription className="text-xs">
                    How this product will look in the storefront card.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="aspect-square w-full overflow-hidden rounded-md border bg-muted">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImage}
                        alt={previewName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No image yet
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="line-clamp-2 text-sm font-medium">
                      {previewName}
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-base font-semibold">
                        ৳{Number(previewPrice).toFixed(0)}
                      </span>
                      {previewPrev > previewPrice && previewPrev > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          ৳{Number(previewPrev).toFixed(0)}
                        </span>
                      )}
                      {previewDiscount > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          -{previewDiscount}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tip
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Only the fields marked with <span className="text-destructive">*</span> are required. Everything else is optional and can be filled in later.
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </FormProvider>
  );
}