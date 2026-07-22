"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, Loader2, Megaphone, Truck } from "lucide-react";
import { toast } from "sonner";

type InitialValues = {
  deliveryInsideDhaka: number;
  deliveryOutsideDhaka: number;
  metaPixelId: string;
  gaMeasurementId: string;
};

export default function SiteSettingsForm({
  initialValues,
}: {
  initialValues: InitialValues;
}) {
  const [deliveryInsideDhaka, setDeliveryInsideDhaka] = useState<number>(
    initialValues.deliveryInsideDhaka,
  );
  const [deliveryOutsideDhaka, setDeliveryOutsideDhaka] = useState<number>(
    initialValues.deliveryOutsideDhaka,
  );
  const [metaPixelId, setMetaPixelId] = useState<string>(
    initialValues.metaPixelId,
  );
  const [gaMeasurementId, setGaMeasurementId] = useState<string>(
    initialValues.gaMeasurementId,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      Number.isNaN(deliveryInsideDhaka) ||
      Number.isNaN(deliveryOutsideDhaka) ||
      deliveryInsideDhaka < 0 ||
      deliveryOutsideDhaka < 0
    ) {
      toast.error("Delivery charges must be non-negative numbers.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/web-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          deliveryCharge: {
            insideDhaka: deliveryInsideDhaka,
            outsideDhaka: deliveryOutsideDhaka,
          },
          metaPixelId: metaPixelId.trim(),
          gaMeasurementId: gaMeasurementId.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update site settings.");
      }

      toast.success("Site settings updated.");
    } catch (error) {
      console.error("Update site settings error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update site settings.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-none border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Charges
              </CardTitle>
              <CardDescription>
                The storefront checkout applies <strong>Inside Dhaka</strong>{" "}
                when the district matches <code>/dhaka|ঢাকা/i</code>;
                everything else uses <strong>Outside Dhaka</strong>. Landing-page
                orders don&apos;t ask for a district, so they always use{" "}
                <strong>Outside Dhaka</strong>. Both amounts are in BDT.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inside-dhaka">Inside Dhaka (BDT)</Label>
                  <Input
                    id="inside-dhaka"
                    type="number"
                    min={0}
                    value={deliveryInsideDhaka}
                    onChange={(e) =>
                      setDeliveryInsideDhaka(Number(e.target.value))
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outside-dhaka">Outside Dhaka (BDT)</Label>
                  <Input
                    id="outside-dhaka"
                    type="number"
                    min={0}
                    value={deliveryOutsideDhaka}
                    onChange={(e) =>
                      setDeliveryOutsideDhaka(Number(e.target.value))
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="shadow-none border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Meta (Facebook) Pixel
              </CardTitle>
              <CardDescription>
                Paste your Pixel ID from Meta Events Manager. Leave it blank to
                skip loading the tracker.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="meta-pixel-id">Pixel ID</Label>
                <Input
                  id="meta-pixel-id"
                  placeholder="e.g. 123456789012345"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>


          <Card className="shadow-none border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Google Analytics
              </CardTitle>
              <CardDescription>
                Paste your GA4 Measurement ID. Leave it blank to skip loading
                the tracker. Page views are tracked automatically when the ID is
                set.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="ga-measurement-id">Measurement ID</Label>
                <Input
                  id="ga-measurement-id"
                  placeholder="e.g. G-XXXXXXXXXX"
                  value={gaMeasurementId}
                  onChange={(e) => setGaMeasurementId(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

    

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}