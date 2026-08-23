"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Loader2,
  Save,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

// Shape stored in the siteInfo doc -> courier subdocument.
// Defined inline to avoid coupling the form to the mongoose model; server
// routes validate the same shape independently.
interface CourierFormState {
  // --- Pathao ---
  pathaoBaseUrl: string;
  pathaoStoreId: string;
  pathaoClientId: string;
  pathaoClientSecret: string;
  pathaoClientEmail: string;
  pathaoClientPassword: string;
  pathaoAccessToken: string;
  pathaoEnabled: boolean;

  // --- Steadfast ---
  steadfastBaseUrl: string;
  steadfastApiKey: string;
  steadfastSecretKey: string;
  steadfastEnabled: boolean;

  // --- RedX ---
  redxBaseUrl: string;
  redxStoreId: string;
  redxApiToken: string;
  redxEnabled: boolean;
}

const DEFAULTS: CourierFormState = {
  pathaoBaseUrl: "https://api-hermes.pathao.com",
  pathaoStoreId: "",
  pathaoClientId: "",
  pathaoClientSecret: "",
  pathaoClientEmail: "",
  pathaoClientPassword: "",
  pathaoAccessToken: "",
  pathaoEnabled: false,

  steadfastBaseUrl: "https://portal.packzy.com/api/v1",
  steadfastApiKey: "",
  steadfastSecretKey: "",
  steadfastEnabled: false,

  redxBaseUrl: "https://openapi.redx.com.bd/v1.0.0-beta",
  redxStoreId: "",
  redxApiToken: "",
  redxEnabled: false,
};

// Field toggles so the user can hide the secrets behind a "show" toggle
// rather than pasting them visibly all the time.
type SecretKey = Extract<
  keyof CourierFormState,
  "pathaoClientSecret" | "pathaoClientPassword" | "steadfastApiKey" | "steadfastSecretKey" | "redxApiToken"
>;

export default function CouriersApiForm() {
  const [form, setForm] = useState<CourierFormState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [show, setShow] = useState<Record<SecretKey, boolean>>({
    pathaoClientSecret: false,
    pathaoClientPassword: false,
    steadfastApiKey: false,
    steadfastSecretKey: false,
    redxApiToken: false,
  });

  // Load current credentials on mount. Server strips secrets it doesn't know
  // are public-facing, but here we treat every secret the same way — read-only
  // from the API and masked in the UI until the user clicks the eye icon.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/courier-credentials", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data?.success && data?.data?.courier) {
          setForm({ ...DEFAULTS, ...flatten(data.data.courier) });
        } else if (!res.ok) {
          toast.error(data?.message || "Failed to load courier settings.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Could not load courier settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof CourierFormState>(
    key: K,
    value: CourierFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSecret = (key: SecretKey) =>
    setShow((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async (provider: "pathao" | "steadfast" | "redx") => {
    setSaving(true);
    try {
      const payload = buildPayload(form, provider);
      const res = await fetch("/api/v1/courier-credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider, credentials: payload }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Save failed");
      }
      // Re-pull so masked fields stay aligned with what the server stored.
      toast.success(`${labelOf(provider)} credentials saved.`);
      if (data.data?.courier) {
        setForm({ ...DEFAULTS, ...flatten(data.data.courier) });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save credentials."
      );
    } finally {
      setSaving(false);
    }
  };

  // Pathao uses OAuth-style token issuance: client_id+client_secret+email+password
  // -> bearer token. We bundle that workflow into a single button click so the
  // admin doesn't have to use curl.
  const handleGeneratePathaoToken = async () => {
    const { pathaoBaseUrl, pathaoClientId, pathaoClientSecret, pathaoClientEmail, pathaoClientPassword } = form;
    if (!pathaoBaseUrl || !pathaoClientId || !pathaoClientSecret || !pathaoClientEmail || !pathaoClientPassword) {
      toast.error("Please fill Base URL, Client ID, Client Secret, Email, and Password first.");
      return;
    }
    setGeneratingToken(true);
    try {
      const res = await fetch("/api/v1/courier-credentials/pathao/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Token generation failed");
      }
      toast.success("Pathao access token generated and saved.");
      if (data.data?.courier) {
        setForm({ ...DEFAULTS, ...flatten(data.data.courier) });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not generate Pathao token."
      );
    } finally {
      setGeneratingToken(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading courier settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PathaoCard
        form={form}
        update={update}
        show={show}
        toggleSecret={toggleSecret}
        onSave={() => handleSave("pathao")}
        onGenerateToken={handleGeneratePathaoToken}
        saving={saving}
        generatingToken={generatingToken}
      />
      <SteadfastCard
        form={form}
        update={update}
        show={show}
        toggleSecret={toggleSecret}
        onSave={() => handleSave("steadfast")}
        saving={saving}
      />
      <RedXCard
        form={form}
        update={update}
        show={show}
        toggleSecret={toggleSecret}
        onSave={() => handleSave("redx")}
        saving={saving}
      />
    </div>
  );
}

function PathaoCard({
  form,
  update,
  show,
  toggleSecret,
  onSave,
  onGenerateToken,
  saving,
  generatingToken,
}: {
  form: CourierFormState;
  update: <K extends keyof CourierFormState>(key: K, value: CourierFormState[K]) => void;
  show: Record<SecretKey, boolean>;
  toggleSecret: (key: SecretKey) => void;
  onSave: () => void;
  onGenerateToken: () => void;
  saving: boolean;
  generatingToken: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> PATHAO
          </CardTitle>
          <CardDescription>
            Pathao Courier Merchant API — paste your production credentials and
            click &quot;Generate Access Token&quot; so we can create parcels on
            your behalf.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="pathaoEnabled" className="text-xs uppercase tracking-wider text-muted-foreground">
            Enable
          </Label>
          <Switch
            id="pathaoEnabled"
            checked={form.pathaoEnabled}
            onCheckedChange={(v) => update("pathaoEnabled", v)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field
          id="pathaoBaseUrl"
          label="Pathao API Base URL"
          value={form.pathaoBaseUrl}
          onChange={(v) => update("pathaoBaseUrl", v)}
          placeholder="https://api-hermes.pathao.com"
          hint="Use https://courier-api-sandbox.pathao.com for testing."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="pathaoStoreId"
            label="Store ID"
            value={form.pathaoStoreId}
            onChange={(v) => update("pathaoStoreId", v)}
            placeholder="e.g. 12345"
          />
          <Field
            id="pathaoClientId"
            label="Client ID"
            value={form.pathaoClientId}
            onChange={(v) => update("pathaoClientId", v)}
          />
        </div>

        <SecretField
          id="pathaoClientSecret"
          label="Client Secret"
          value={form.pathaoClientSecret}
          onChange={(v) => update("pathaoClientSecret", v)}
          shown={show.pathaoClientSecret}
          onToggle={() => toggleSecret("pathaoClientSecret")}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="pathaoClientEmail"
            label="Client Email"
            value={form.pathaoClientEmail}
            onChange={(v) => update("pathaoClientEmail", v)}
            placeholder="merchant@example.com"
            type="email"
          />
          <SecretField
            id="pathaoClientPassword"
            label="Client Password"
            value={form.pathaoClientPassword}
            onChange={(v) => update("pathaoClientPassword", v)}
            shown={show.pathaoClientPassword}
            onToggle={() => toggleSecret("pathaoClientPassword")}
            type="password"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="pathaoAccessToken"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80"
          >
            Access Token
          </Label>
          <Input
            id="pathaoAccessToken"
            value={form.pathaoAccessToken}
            readOnly
            placeholder="Will be filled automatically after you click Generate"
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            We issue and refresh the access token automatically. Manual editing
            is not supported.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={onSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Pathao Settings
          </Button>
          <Button
            onClick={onGenerateToken}
            disabled={generatingToken || saving}
            variant="secondary"
            className="gap-2"
          >
            {generatingToken ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Generate Access Token
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SteadfastCard({
  form,
  update,
  show,
  toggleSecret,
  onSave,
  saving,
}: {
  form: CourierFormState;
  update: <K extends keyof CourierFormState>(key: K, value: CourierFormState[K]) => void;
  show: Record<SecretKey, boolean>;
  toggleSecret: (key: SecretKey) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> STEADFAST
            <Badge variant="outline" className="ml-1 font-normal">No token required</Badge>
          </CardTitle>
          <CardDescription>
            Steadfast Courier uses an API key + secret key pair. Both keys are
            available from your Steadfast dashboard.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="steadfastEnabled" className="text-xs uppercase tracking-wider text-muted-foreground">
            Enable
          </Label>
          <Switch
            id="steadfastEnabled"
            checked={form.steadfastEnabled}
            onCheckedChange={(v) => update("steadfastEnabled", v)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field
          id="steadfastBaseUrl"
          label="Steadfast API Base URL"
          value={form.steadfastBaseUrl}
          onChange={(v) => update("steadfastBaseUrl", v)}
          placeholder="https://portal.packzy.com/api/v1"
          hint="Use the sandbox URL provided by Steadfast for testing."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <SecretField
            id="steadfastApiKey"
            label="API Key"
            value={form.steadfastApiKey}
            onChange={(v) => update("steadfastApiKey", v)}
            shown={show.steadfastApiKey}
            onToggle={() => toggleSecret("steadfastApiKey")}
          />
          <SecretField
            id="steadfastSecretKey"
            label="Secret Key"
            value={form.steadfastSecretKey}
            onChange={(v) => update("steadfastSecretKey", v)}
            shown={show.steadfastSecretKey}
            onToggle={() => toggleSecret("steadfastSecretKey")}
          />
        </div>

        <div className="pt-2">
          <Button onClick={onSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Steadfast Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RedXCard({
  form,
  update,
  show,
  toggleSecret,
  onSave,
  saving,
}: {
  form: CourierFormState;
  update: <K extends keyof CourierFormState>(key: K, value: CourierFormState[K]) => void;
  show: Record<SecretKey, boolean>;
  toggleSecret: (key: SecretKey) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> REDX
            <Badge variant="outline" className="ml-1 font-normal">Bearer token</Badge>
          </CardTitle>
          <CardDescription>
            RedX courier uses a single API token as a Bearer credential. Find it
            in your RedX merchant dashboard under Developer settings.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="redxEnabled" className="text-xs uppercase tracking-wider text-muted-foreground">
            Enable
          </Label>
          <Switch
            id="redxEnabled"
            checked={form.redxEnabled}
            onCheckedChange={(v) => update("redxEnabled", v)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field
          id="redxBaseUrl"
          label="RedX API Base URL"
          value={form.redxBaseUrl}
          onChange={(v) => update("redxBaseUrl", v)}
          placeholder="https://openapi.redx.com.bd/v1.0.0-beta"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="redxStoreId"
            label="Store ID"
            value={form.redxStoreId}
            onChange={(v) => update("redxStoreId", v)}
            placeholder="Optional — used for area lookups"
          />
          <SecretField
            id="redxApiToken"
            label="API Token"
            value={form.redxApiToken}
            onChange={(v) => update("redxApiToken", v)}
            shown={show.redxApiToken}
            onToggle={() => toggleSecret("redxApiToken")}
          />
        </div>

        <div className="pt-2">
          <Button onClick={onSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save RedX Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80"
      >
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SecretField({
  id,
  label,
  value,
  onChange,
  shown,
  onToggle,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  shown: boolean;
  onToggle: () => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={shown ? "text" : type === "password" ? "password" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={shown ? "Hide value" : "Show value"}
          className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ---- helpers ---------------------------------------------------------------

function labelOf(p: "pathao" | "steadfast" | "redx") {
  return p === "pathao" ? "Pathao" : p === "steadfast" ? "Steadfast" : "RedX";
}

function flatten(obj: Record<string, unknown>): Partial<CourierFormState> {
  // Convert { pathaoBaseUrl: "..." } -> { pathaoBaseUrl: "..." }.
  // The server already returns camelCased keys, so this is mostly a no-op but
  // it stays defensive in case the DB shape changes.
  const out: Partial<CourierFormState> = {};
  for (const k of Object.keys(obj) as (keyof CourierFormState)[]) {
    if (k in DEFAULTS) {
      (out as Record<string, unknown>)[k] = obj[k];
    }
  }
  return out;
}

// Only send the slice that belongs to the provider — keeps payloads small
// and prevents overwriting other providers by accident.
function buildPayload(form: CourierFormState, provider: "pathao" | "steadfast" | "redx"): Record<string, unknown> {
  if (provider === "pathao") {
    return {
      pathaoBaseUrl: form.pathaoBaseUrl,
      pathaoStoreId: form.pathaoStoreId,
      pathaoClientId: form.pathaoClientId,
      pathaoClientSecret: form.pathaoClientSecret,
      pathaoClientEmail: form.pathaoClientEmail,
      pathaoClientPassword: form.pathaoClientPassword,
      pathaoEnabled: form.pathaoEnabled,
    };
  }
  if (provider === "steadfast") {
    return {
      steadfastBaseUrl: form.steadfastBaseUrl,
      steadfastApiKey: form.steadfastApiKey,
      steadfastSecretKey: form.steadfastSecretKey,
      steadfastEnabled: form.steadfastEnabled,
    };
  }
  return {
    redxBaseUrl: form.redxBaseUrl,
    redxStoreId: form.redxStoreId,
    redxApiToken: form.redxApiToken,
    redxEnabled: form.redxEnabled,
  };
}
