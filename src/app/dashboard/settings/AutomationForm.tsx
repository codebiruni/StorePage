"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Workflow } from "lucide-react";
import { toast } from "sonner";

interface AutomationState {
  n8nWebhookUrl: string;
  facebookAccessToken: string;
  hasFacebookAccessToken: boolean;
}

const DEFAULTS: AutomationState = {
  n8nWebhookUrl: "",
  facebookAccessToken: "",
  hasFacebookAccessToken: false,
};

export default function AutomationForm() {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/automation", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);
        setForm({ ...DEFAULTS, ...data.data });
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load automation settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v1/automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          n8nWebhookUrl: form.n8nWebhookUrl,
          facebookAccessToken: form.facebookAccessToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save automation settings.");
      setForm((current) => ({
        ...current,
        facebookAccessToken: "",
        hasFacebookAccessToken: true,
      }));
      toast.success(data.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save automation settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading automation settings…</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Workflow className="h-5 w-5" />Automation</CardTitle>
          <CardDescription>Store your n8n webhook URL and Facebook access token for later use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="n8n-webhook-url">n8n Webhook URL</Label>
            <Input id="n8n-webhook-url" type="url" placeholder="https://your-n8n.example.com/webhook/..." value={form.n8nWebhookUrl} onChange={(e) => setForm({ ...form, n8nWebhookUrl: e.target.value })} required disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook-access-token">Facebook Access Token</Label>
            <Input id="facebook-access-token" type="password" placeholder={form.hasFacebookAccessToken ? "Token saved — enter a new one to replace it" : "Enter your Facebook access token"} value={form.facebookAccessToken} onChange={(e) => setForm({ ...form, facebookAccessToken: e.target.value })} required={!form.hasFacebookAccessToken} disabled={saving} autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving…" : "Save Automation Settings"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
