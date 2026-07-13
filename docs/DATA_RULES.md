# Data Rules — Multi-Tenant StorePage

This codebase is built to be deployable as a **single code base** to many different
tenants. Every tenant differs in branding, copy, contact info, social links, banner
images, and so on — but **not in code**. The DB document in the `siteinfo` collection
(or, when that document does not exist yet, the `.env` defaults) is the only
difference between deployments.

To make that promise safe, three rules apply everywhere data flows through this
project. They are non-negotiable.

---

## Rule 1 — Schema-less writes

When the app writes a document (admin panel, seed script, signup flow, etc.) it must
**never assume a field is required that isn't in the schema.** If a Mongoose schema
marks a field `required: true` and a tenant leaves it blank, Mongoose rejects the
write and the whole request fails.

Consequence:

- **All fields that may legitimately be left blank are marked optional** (`required`
  is omitted). They get a `default: '' | [] | {}` instead — see Rule 2.
- **Required fields are only the truly critical ones** (e.g. `name`, `email`,
  `number` for a tenant to exist at all).
- When extending a schema, ask yourself first: *does every future tenant need this
  field populated to even render the site?* If no, leave it optional + defaulted.

Bad:

```ts
// ❌ Forces every tenant to fill youtube even if they have no channel.
youtube: { type: String, required: true },
```

Good:

```ts
// ✅ Empty string is a valid state.
youtube: { type: String, default: "" },
```

---

## Rule 2 — Defensive reads (`??`)

The runtime consumer (`getSiteConfig()` and every place that reads from a model)
**must use `??`** when reading a value that could be missing or could be empty.
This guarantees that:

1. The `.env` defaults layer always wins when the DB layer returns nothing.
2. The DB layer always wins when `.env` returns nothing.
3. A future schema change (adding/removing fields) does not crash older tenants.

Pattern (used in `src/lib/siteConfig.ts`):

```ts
const base: SiteConfig = getEnvSiteConfig();
const doc = await SiteInfo.findOne({}).lean();
if (!doc) return base;

// Every field falls back to the env default if the DB doc leaves it undefined.
return {
  ...base,
  name: doc.name ?? base.name,
  logo: doc.logo ?? base.logo,
  tagline: doc.tagline ?? base.tagline,
  banner: doc.banner ?? base.banner,
  socialContact: {
    ...base.socialContact,
    ...(doc.socialContact ?? {}),       // layer the two objects
    facebook: doc.socialContact?.facebook ?? base.socialContact.facebook,
    youtube: doc.socialContact?.youtube ?? base.socialContact.youtube,
    // ...
  },
  addresses: doc.addresses ?? base.addresses,
  footerLinks: doc.footerLinks ?? base.footerLinks,
};
```

Rules of thumb:

- `undefined` from DB → env default wins.
- `""` or `[]` or `{}` from DB → DB wins (tenant explicitly cleared it).
- Never use `||` for fallback — `""` is a valid DB value and would be silently
  replaced by `||`.

---

## Rule 3 — Frontend optional chaining (`?.`)

Every consumer of `useSiteConfig()` in React components **must use optional
chaining** when reading nested values. Even though the provider guarantees a
fully-typed object, this rule protects against:

- A future hot reload where the API has not yet returned and the value is still
  the env-only initial config.
- A new field added to the config that an older bundle does not yet know about.
- An older component imported into a newer deployment that has different config
  shape.

Pattern:

```tsx
const { name, socialContact, addresses } = useSiteConfig();

return (
  <footer>
    <h4>{name}</h4>
    <a href={socialContact?.facebook ?? "#"}>Facebook</a>
    {addresses?.map((a, i) => <p key={i}>{a?.name}</p>)}
  </footer>
);
```

Rules of thumb:

- Treat every value coming out of `useSiteConfig()` as potentially `undefined`
  for the first render.
- Prefer `?.` over `&&` chains when you would otherwise need a default.
- Never destructure without re-defaulting in the component if you cannot prove
  the field is non-optional at type level.

---

## Mongoose schema defaults — the safety net

Rule 2 only works if the DB never returns `undefined` for a field. Mongoose's
`lean()` queries return `undefined` for fields that were never set on the document.
To prevent that, **every non-required field in `src/models/*.model.ts` must have
a `default`**:

| Type    | Default       |
|---------|---------------|
| String  | `""`          |
| Number  | `0`           |
| Boolean | `false`       |
| Array   | `[]`          |
| Object  | `{}` (or the literal shape the schema describes) |

This way `doc.youtube` is `""` instead of `undefined`, and the `??` chain still
behaves correctly (an empty string is a valid DB value that overrides the env
default — which is what we want when the admin clears a field).

---

## How to extend the system safely

1. **Add a new tenant-facing field** (e.g. `tiktok`):
   - Add it to `ISiteInfo` interface as optional.
   - Add it to `SiteInfoSchema` with `default: ""`.
   - Add a `NEXT_PUBLIC_BRAND_TIKTOK` env default + `getEnvSiteConfig()` entry.
   - Add `doc.socialContact?.tiktok ?? base.socialContact.tiktok` in
     `getSiteConfig()`.
   - Read it with `socialContact?.tiktok` in any React component.

2. **Add a new required field** (e.g. `legalName`):
   - Add it to `ISiteInfo` as required.
   - Mark `required: true` in the schema.
   - Add it to `getEnvSiteConfig()` as a sensible default — required is only
     meaningful if the seed flow provides a value.
   - Update the admin panel / seed script to populate it for every new tenant.

3. **Never** read a model field with a non-null assertion (`!`) or a hard
   `as string` cast without a defensive fallback upstream.

---

## Why these rules exist

Without them:

- A new tenant skipping a single field would crash every page that reads it.
- An admin clearing a field (intentionally) would silently revert to the env
  default, hiding the change.
- A future schema migration would break every deployment that hadn't run it yet.

With them:

- Every tenant renders, even with an empty DB document — env defaults carry them.
- Every admin override sticks — `??` only fires on `undefined`, not on `""`.
- Every schema migration is forward-compatible — old documents just lose
  overrides, env defaults take over for the missing fields.