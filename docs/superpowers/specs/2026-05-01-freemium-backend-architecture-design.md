# Freemium Backend Architecture: Sync, CMS, Premium Across Web + Mobile

## Problem

BaseSkill is currently 100% client-side: RxDB on top of IndexedDB stores
everything (game data, history, bookmarks, settings). The app is offline-first
by design and the primary audience is kids on tablets.

We need a backend to support three forthcoming capabilities, in priority order:

1. **Cross-device game history sync** — when a user signs in, their per-session
   play history syncs from local IndexedDB to the cloud and back.
2. **CMS-controlled game presets** — admin authoring of game content (word
   lists, level definitions, presets) without redeploying the app.
3. **Freemium with cross-platform family sharing** — premium content unlocked by
   subscription **and/or one-time purchases**, where the entitlement is
   recognised by a whole household across web, iOS, and Android. Initial
   monetisation includes both a free hub app and standalone paid apps
   (one-time purchase) per game pack.

Constraints driving the design:

- **Money-conscious** — zero users today, unknown growth curve. The bill must
  round to ~$0 at the current scale and grow predictably with usage.
- **Cloud-leaning** — preference for managed cloud primitives over opinionated
  SaaS lock-in, but with pragmatic exceptions where the world has converged
  (auth, payments, mobile receipt validation).
- **Offline-first must remain intact** — anonymous users keep playing without
  ever talking to the backend. Cloud is an upgrade path, not a gate.
- **Mobile is imminent** — kid-targeted iOS/Android apps are coming soon, even
  if initially free-only. Architecture must not paint us into a web-only corner.

## Decisions

| Concern               | Choice                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Database              | **Supabase Postgres** (managed, self-hostable escape hatch)                                                                              |
| Auth                  | **Supabase Auth** (email/password + social, RLS-integrated)                                                                              |
| Sync layer            | **RxDB → Supabase replication plugin**                                                                                                   |
| Web payment           | **Stripe**                                                                                                                               |
| Mobile payment (P3)   | **Apple IAP + Google Play Billing via RevenueCat**                                                                                       |
| Static asset delivery | **Supabase Storage** initially; Cloudflare R2 if egress justifies later                                                                  |
| Premium gating        | **Postgres Row Level Security (RLS) policies** keyed on household membership                                                             |
| Pricing strategy      | **Platform-tiered**: web price is the base; iOS/Android marked up to recover store fees                                                  |
| Product model         | **Mixed**: standalone paid apps (one-time, per-game) plus a premium subscription on the free hub — both flow into one entitlements table |
| Cross-app linking     | Free hub app links to standalone paid apps via App Store / Play Store URLs (explicitly allowed)                                          |
| App + webhooks host   | **Cloudflare Pages + Workers** — TanStack Start deployed to Pages, webhook endpoints as Workers in the same project                      |

### Why Supabase over the AWS path

The AWS path (DynamoDB + Cognito + Lambda + API Gateway + S3) was the obvious
"cloud, not SaaS" answer and remains valid. We rejected it for these reasons:

- **RxDB has a first-class Supabase replication plugin.** This collapses weeks
  of custom sync code (Lambda + DynamoDB Streams + conflict resolution) into a
  config block.
- **Postgres RLS makes freemium gating declarative.** Entitlement enforcement
  lives at the table level, not in application code.
- **Predictable, flat pricing.** $0 free tier → $25/month Pro. No surprise
  bills from a runaway Lambda or DynamoDB scan.
- **Self-hostable.** Supabase is open-source Postgres + GoTrue + PostgREST.
  If the hosted service ever fails us, we run the same stack on any VPS with
  no application changes. The data is portable Postgres, not a proprietary
  format.
- **One product to learn.** Solo developer leverage matters more than
  hyper-optimized cost at scale we don't yet have.

### Why Cloudflare Pages + Workers as the app host

Two viable defaults — Cloudflare Pages and Vercel — both have first-class
TanStack Start support. We pick Cloudflare for the cost slope:

- **Free tier covers our scale indefinitely** — unlimited bandwidth on free
  Pages, 100k Worker requests/day, 500 builds/month
- **No bandwidth fees** — important once kid-targeted tablets pull MB-scale
  game asset bundles
- **Global edge by default** — Workers run near the user, no region selection
- **Webhooks colocated with the app** — Stripe and RevenueCat endpoints live
  as Workers in the same project, avoiding a separate API gateway
- **Natural fit with the Phase 2 R2 + CDN optimisation** — same Cloudflare
  account, same dashboard, no cross-vendor egress

Vercel remains a defensible alternative for slightly better PR-preview
ergonomics. The trade is roughly $20–25 per developer-seat per month on the
Pro plan vs. effectively free on Cloudflare.

Webhook endpoints (Stripe, RevenueCat, Apple Server Notifications, Google
Real-Time Developer Notifications) deploy as **Cloudflare Workers** in the
same Pages project. We keep the option open to use **Supabase Edge
Functions** for any webhook that benefits from very tight Postgres coupling,
but the default is Workers to minimise the number of deploy targets.

### Why not split DB and CDN now

We considered putting presets behind Cloudflare R2 + CDN from day one. That
delivers near-zero read costs at the price of a static-export pipeline.

Rejected as premature: at our scale, Postgres reads via PostgREST cost cents
per million. The R2/CDN export is a documented Phase 2 optimization (below)
and the application code does not change when we add it.

## Architecture

### Phased rollout

```text
Phase 1 — Web freemium (now)
  Supabase Postgres + Auth + Stripe
  RxDB ↔ Supabase replication for game_history
  Direct PostgREST queries for game_presets (RLS-filtered)
  Household model in place from day one (households of size 1)
  Entitlements table supports BOTH subscription and one-time purchase shapes

Phase 2 — Mobile sign-in + standalone paid apps (next)
  Free hub app on iOS/Android with sign-in only (Spotify model)
  Standalone paid apps per game pack on App Store / Play Store
    (one-time purchase, no backend required for offline play)
  Free hub deep-links to paid apps via App Store / Play Store URLs
  Optional: paid apps validate receipt server-side and register
    a one-time entitlement against the user's household

Phase 3 — Premium subscription on mobile (mobile-monetisation follow-up)
  Free hub app gains an "Unlock Premium" IAP flow via RevenueCat
  RevenueCat webhooks → Supabase Edge Function → upsert entitlements
  Apple Family Sharing auto-links family Apple IDs into the household
  Standalone paid apps continue as a parallel revenue stream
```

Each phase is independently shippable. The Phase 1 data model (households,
not users, hold entitlements) is the architectural insight that makes
phases 2 and 3 additive rather than rewriting.

### Data flow — Phase 1

```text
                 ┌──────────────────────────────────────┐
                 │ Anonymous user                       │
                 │  ─ IndexedDB only                    │
                 │  ─ never calls Supabase              │
                 │  ─ $0 to us                          │
                 └──────────────────────────────────────┘
                                │ signs up
                                ▼
                 ┌──────────────────────────────────────┐
                 │ Authenticated user (free)            │
                 │  ─ Supabase Auth issues JWT          │
                 │  ─ Auto-assigned household-of-one    │
                 │  ─ RxDB replicates game_history → Postgres  │
                 │  ─ Reads presets where required_product_id IS NULL │
                 └──────────────────────────────────────┘
                                │ pays via Stripe Checkout
                                ▼
                 ┌──────────────────────────────────────┐
                 │ Stripe webhook → Edge Function       │
                 │  ─ verify signature                  │
                 │  ─ upsert entitlements               │
                 │     (household_id, source='stripe',  │
                 │      product_id, kind, expires_at)   │
                 │  ─ kind='subscription' → expires_at  │
                 │     set to period_end                │
                 │  ─ kind='one_time' → expires_at NULL │
                 └──────────────────────────────────────┘
                                │
                                ▼
                 ┌──────────────────────────────────────┐
                 │ Entitled household                   │
                 │  ─ SELECT on game_presets now also   │
                 │     returns rows whose                │
                 │     required_product_id matches an   │
                 │     active entitlement               │
                 │  ─ No JWT refresh required — RLS     │
                 │     reads live entitlements row      │
                 └──────────────────────────────────────┘
```

### Data model

Schema lives in Postgres. All tables have RLS enabled.

```sql
-- One row per authenticated user, mirrors auth.users
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- Households are the entitlement holder
create table households (
  id uuid primary key default gen_random_uuid(),
  name text,
  owner_user_id uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- Many-to-many: a user belongs to one or more households
create table household_members (
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',  -- 'owner' | 'member'
  joined_at timestamptz default now(),
  primary key (household_id, user_id)
);

-- Entitlements belong to a household, not a user.
-- Single table covers both recurring subscriptions and one-time purchases.
create table entitlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  product_id text not null,             -- 'premium_subscription' | 'math_pack_v1' | 'phonics_pack_v1'
  kind text not null,                   -- 'subscription' | 'one_time'
  source text not null,                 -- 'stripe' | 'apple_iap' | 'apple_paid_app'
                                        -- | 'google_iap' | 'google_paid_app'
  external_id text not null unique,     -- stripe sub/payment id, apple originalTxId, google purchaseToken
  status text not null,                 -- 'active' | 'in_grace' | 'expired' | 'refunded'
  expires_at timestamptz,               -- null = never expires (one-time); date = subscription period end
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Game presets, gated by required entitlement product_id (null = free)
create table game_presets (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  name text not null,
  data jsonb not null,
  required_product_id text,             -- null = free; otherwise must match entitlements.product_id
  published boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Per-user history (RxDB sync target)
create table game_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  preset_id uuid references game_presets(id),
  played_at timestamptz not null default now(),
  duration_ms int,
  score int,
  events jsonb,
  -- RxDB replication metadata
  rxdb_updated_at timestamptz not null default now(),
  rxdb_deleted boolean not null default false
);

create index on entitlements (household_id, product_id, status, expires_at);
create index on household_members (user_id);
create index on game_history (user_id, played_at desc);
create index on game_presets (game_id, required_product_id) where published;
```

### RLS policies

A `SECURITY DEFINER` helper centralises the membership check. This is
required because policies that join to `household_members` would otherwise
trigger their own policy on the join target, causing recursion. The helper
runs with definer privileges and bypasses RLS, so it terminates cleanly.

```sql
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

alter table profiles enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table entitlements enable row level security;
alter table game_presets enable row level security;
alter table game_history enable row level security;

-- Profiles: users see and update only their own
create policy "users read own profile" on profiles for select
  using (user_id = auth.uid());
create policy "users update own profile" on profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Households: members can read; only owner can update
create policy "members read household" on households for select
  using (is_household_member(id));
create policy "owner updates household" on households for update
  using (owner_user_id = auth.uid());

-- Household members: a user can see their own row, plus rows of fellow
-- members of any household they belong to.
create policy "members read membership" on household_members for select
  using (user_id = auth.uid() or is_household_member(household_id));

-- Entitlements: read-only to household members; mutations service-role only
create policy "members read household entitlements" on entitlements for select
  using (is_household_member(household_id));
-- (No INSERT/UPDATE/DELETE policy → only Stripe/RevenueCat/paid-app webhooks
--  using service_role can write)

-- Game presets: free unless required_product_id is set, in which case the
-- user must belong to a household with an active matching entitlement.
create policy "presets visible per entitlement" on game_presets for select
  using (
    published
    and (
      required_product_id is null
      or exists (
        select 1
        from household_members hm
        join entitlements e on e.household_id = hm.household_id
        where hm.user_id = auth.uid()
          and e.product_id = game_presets.required_product_id
          and e.status = 'active'
          and (e.expires_at is null or e.expires_at > now())
      )
    )
  );

-- Game history: users see and write only their own
create policy "users read own history" on game_history for select
  using (user_id = auth.uid());
create policy "users insert own history" on game_history for insert
  with check (user_id = auth.uid());
create policy "users update own history" on game_history for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

### Auto-create household on sign-up

A Postgres trigger creates a household-of-one immediately on user creation, so
every authenticated user has an entitlement target from day one. This keeps the
RLS join valid and means Phase 3 (multi-member households) is purely additive.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into profiles (user_id) values (new.id);
  insert into households (name, owner_user_id)
    values (coalesce(new.raw_user_meta_data->>'display_name', 'My Household'),
            new.id)
    returning id into new_household_id;
  insert into household_members (household_id, user_id, role)
    values (new_household_id, new.id, 'owner');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Sync — RxDB replication

The web client keeps RxDB as the local store. When the user is authenticated,
we attach Supabase replication for the `game_history` collection only.

```text
Browser RxDB collections:
  ├─ gameHistory          ← replicated bidirectionally with Supabase
  ├─ bookmarks            ← local only (Phase 1)
  ├─ settings             ← local only (Phase 1)
  └─ presets              ← read-only mirror, refreshed via PostgREST query
```

`game_presets` is **not** RxDB-replicated. It is a server-authoritative resource
fetched directly via PostgREST and cached in RxDB for offline reads. CMS edits
never originate from the client, so bidirectional replication adds no value
and adds conflict-handling cost.

### Stripe integration

Stripe handles two product shapes for the web:

- **Subscription products** (`mode='subscription'` Checkout sessions) →
  `kind='subscription'`, `expires_at = period_end`, renews automatically
- **One-time products** (`mode='payment'` Checkout sessions) →
  `kind='one_time'`, `expires_at = NULL` (perpetual)

Flow:

```text
1. User clicks "Buy" → web app calls TanStack Start server function
   → server function creates Stripe Checkout session (subscription or one-time
     based on product) → returns Checkout URL
2. User completes Checkout on Stripe-hosted page
3. Stripe sends webhook to /api/stripe-webhook
4. Supabase Edge Function (or TanStack Start API route) verifies the
   signature, then upserts the entitlements row with the user's
   household_id, source='stripe', product_id, kind, and (for subscriptions)
   period_end as expires_at
5. RLS immediately reflects the new entitlement on the next preset query
```

Failure handling for subscriptions: on `customer.subscription.deleted`, set
`status='expired'`, leave `expires_at` at the period end so the user keeps
access through what they already paid for. One-time purchases are flipped to
`status='refunded'` only on a Stripe `charge.refunded` event.

### Phase 2 — Mobile: free hub + standalone paid apps

Two app types ship simultaneously to the App Store and Play Store:

**Free hub app.** Same Supabase Auth flow as web. Reads presets and game
history through the same RLS path. **No purchase UI inside the hub yet.**
This complies with Apple's Multiplatform Service rule
(Guideline 3.1.3(b)): users may consume on iOS what they purchased on the
web. The hub also displays a **catalog of standalone paid apps** with deep
links to each app's App Store / Play Store listing — explicitly allowed
(Apple takes its cut on the resulting paid-app purchase regardless).

**Standalone paid apps.** One published app per game pack (e.g.
_BaseSkill: Math Pack_, _BaseSkill: Phonics Pack_). Each is a one-time paid
download from the App Store / Play Store. They work fully offline and need
no backend. Optionally — and recommended — each paid app on first launch
sends its receipt to a Supabase Edge Function that validates with Apple /
Google and writes a one-time entitlement against the user's household. This
makes the purchase visible on web and other devices.

This is a real launch state, not a bridge. Free hub + a few paid apps is a
fully viable monetisation mix until subscription IAP arrives in Phase 3.

#### Cross-app linking — what's allowed

| Action                                                                                                   | iOS                                                                              | Android                      |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------- |
| Free app links to your other paid apps in the same store                                                 | ✅ Allowed and encouraged                                                        | ✅ Allowed                   |
| Free app shows price of paid apps before linking                                                         | ✅ Allowed                                                                       | ✅ Allowed                   |
| Free app deep-links to App Store via `https://apps.apple.com/...` or `itms-apps://`                      | ✅ Standard pattern                                                              | n/a                          |
| Free app deep-links to Play Store via `https://play.google.com/store/apps/...` or `market://details?id=` | n/a                                                                              | ✅ Standard pattern          |
| Free app links to **web payment** instead of IAP                                                         | ⚠️ Restricted by anti-steering rules; loosened in EU/US 2024-2025 but per-region | ⚠️ Restricted, similar story |

Linking to other apps you publish is not anti-steering — Apple/Google still
collect their cut on those paid app purchases.

### Phase 3 — Premium subscription on the free hub via RevenueCat

```text
Apple IAP                     Google Play Billing            Stripe (web)
    │                              │                             │
    ▼                              ▼                             ▼
       RevenueCat (validates receipts, normalizes events)
                            │
                            ▼  webhook
                  Supabase Edge Function
                            │
                            ▼
              upsert entitlements(household_id, source, product_id, ...)
                            │
                            ▼
                       RLS unchanged
```

The free hub app gains an in-app "Unlock Premium" subscription flow. The
existing standalone paid apps continue to ship in parallel — they remain a
valid revenue stream and are not retired. A user who buys _Math Pack_ as a
standalone paid app does **not** automatically get the Premium subscription,
and vice versa; entitlements are tracked by `product_id`.

RevenueCat is the de-facto standard for cross-platform mobile IAP.
Justification:

- Apple StoreKit 2 receipt validation, App Store Server Notifications v2,
  Google Play Developer API, Real-Time Developer Notifications, refunds,
  upgrades, downgrades, grace periods, family-sharing receipt detection —
  all handled.
- DIY equivalent is 2–4 weeks of careful work where bugs become silent
  revenue leaks.
- Free up to $2,500 monthly tracked revenue, then 1% of MTR. The 1% is
  vastly cheaper than the engineering cost of getting it right ourselves.
- Replaceable: RevenueCat is purely the validation/entitlement plumbing.
  Entitlement state still lives in our `entitlements` table. If we ever
  leave RevenueCat we re-implement the validation layer; the data model
  doesn't move.

#### Apple Family Sharing → household linkage

When a parent buys a family-sharing-eligible subscription on iOS, Apple
delivers the receipt to up to 5 family Apple IDs. The flow:

1. Family member opens the iOS app, signs in (creates a Supabase user if
   needed)
2. App reads the shared receipt from StoreKit and forwards it (or the
   RevenueCat customer info)
3. Edge Function finds an existing `entitlements` row with the same
   `external_id` (Apple's `originalTransactionId`)
4. If found, adds the new user to that household via `household_members`
5. RLS now grants the family member premium access

The household remains our source of truth. Apple Family Sharing is an
auto-discovery hint, not a backbone. Web and Android families work via
in-app invite flows that write to the same `household_members` table.

## Premium asset delivery — Phase 2 optimization

Initially, `game_presets` is queried directly via PostgREST. RLS handles
gating. This is fine until egress costs justify a CDN.

When that day comes, the upgrade is additive:

```text
Postgres game_presets (system of record, CMS writes here)
    │
    │ Scheduled Edge Function (cron, e.g. every 15 min)
    ▼
Supabase Storage:
  ├─ presets-free.sqlite       (public bucket, CDN-cached, $0/read)
  └─ presets-premium.sqlite    (private bucket, signed URL only)

Browser:
  ├─ For free: direct download of presets-free.sqlite, queried in browser
  │           via wa-sqlite (WebAssembly SQLite)
  └─ For premium: Edge Function checks active entitlement → issues
                  short-lived signed URL → browser downloads file
```

Cache invalidation is solved by the cron rebuild interval. Up to 15 min
content lag is acceptable for game presets.

The wa-sqlite path is one option; per-game JSON files served from CDN are
equally valid. The decision can wait until we have read traffic to optimize.

## Pricing strategy — platform-tiered

Each product (subscription or one-time pack) has a platform-specific price
that recovers the store fee, **not** a single global price. Web is the base.
iOS and Android are marked up to make the post-fee revenue comparable across
channels.

```text
Hypothetical example for "Math Pack" one-time purchase:

  Base intent: ~$5.00 USD net to us per sale

  Web (Stripe ~3% fee):              list at $5.50  → ~$5.30 net
  iOS / Google Play, year 1 sub or > $1m revenue (30%): list at $7.99 → ~$5.59 net
  iOS / Google Play, Small Business / year 2+ sub (15%): list at $5.99 → ~$5.09 net
```

Apple does not require price parity across platforms. Charging more on iOS
than on the web is explicitly permitted. What is **not** permitted (in most
regions) is using the iOS app to _steer_ users toward the cheaper web price.
We will continue to display only the in-app price within the iOS app.

Concretely, this means each product has up to three price points stored in
our system:

```sql
-- Conceptual; finalised when Stripe / RevenueCat catalogue is set up
create table product_prices (
  product_id text not null references ..., -- 'math_pack_v1' etc.
  channel text not null,                   -- 'web' | 'apple' | 'google'
  price_cents int not null,
  currency text not null,
  primary key (product_id, channel, currency)
);
```

For Phase 1 (web only) this table is trivial — one row per product. The
table exists from day one so adding mobile prices is a data change, not a
schema migration.

## Cost projections

Estimates assume conservative pricing as of 2026-Q2. All prices subject to
change.

| Stage              | Authenticated MAU | Notes                                                                                                   | Monthly cost       |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------ |
| Today              | 0                 | Cloudflare Pages free + Supabase free                                                                   | $0                 |
| Early              | <1,000            | Same free tiers; only Stripe transaction fees on revenue                                                | ~$0                |
| Growing (web only) | ~10,000           | Cloudflare free + Supabase Pro ($25) + Stripe ~3% per txn                                               | ~$25 + 3% rev      |
| Mobile launch      | ~10,000           | Same as above + RevenueCat free tier (under $2,500 MTR) + Apple/Google fees on IAP                      | ~$25 + fees        |
| Scaling            | ~100,000          | Cloudflare Workers Paid ($5) + Supabase Team (~$599) + RevenueCat 1% MTR + Apple 15-30% + Google 15-30% | depends on revenue |

The dominant cost lever once the product is monetized is **payment platform
fees, not infrastructure**. Apple and Google's 15–30% dwarfs anything Supabase
or RevenueCat charges.

## Risks and open questions

1. **Apple's anti-steering rules are a moving target.** EU DMA and the US
   Epic v Apple ruling have loosened them in 2024–2025, but specifics shift
   per region and per product. Phase 2 (sign-in only) and Phase 3 (IAP) need
   App Store legal review at the time of launch. Apple may also reject a
   kids-category app that has _no_ in-app purchase path while charging on the
   web, even though Guideline 3.1.3(b) appears to permit it.

2. **Kids Category compliance** — strict rules on parental gates, no
   behavioral analytics, restricted ad formats, COPPA/GDPR-K. This affects
   what telemetry we ship, how we present login UI, and how the household
   invite flow works for minors. Out of scope for this document; needs its
   own compliance review before mobile launch.

3. **RevenueCat lock-in** — minimal because entitlement data lives in our
   Postgres table, but the validation logic is theirs. Acceptable trade.

4. **Supabase free-tier project pause** — Supabase pauses free-tier projects
   after 7 days of inactivity (similar to Oracle). Once we have any real
   traffic this is moot; before then we ping the project periodically (a
   simple cron Edge Function suffices).

5. **RxDB conflict resolution for game_history** — should be near-zero
   because each session is owned by one user on one device at a time, and
   sessions are append-only. We will use RxDB's default last-write-wins
   strategy and revisit only if we see real conflicts.

6. **Tax / VAT on web payments** — Stripe is not a merchant of record.
   International tax compliance is our responsibility. Lemon Squeezy or
   Paddle (merchant-of-record alternatives) become attractive if we sell
   meaningfully outside Australia. Out of scope for Phase 1 launch but
   flagged.

7. **Cloudflare Workers cold-start and runtime quirks.** Workers run on V8
   isolates, not Node. Some npm packages with native bindings or aggressive
   Node-API usage will not work. We need to verify all critical
   dependencies (Stripe SDK, RevenueCat client, Supabase client, RxDB
   server bridge) run cleanly on Workers before committing. If a critical
   dep is incompatible, fall back to Vercel (Node runtime) and accept the
   higher cost slope.

8. **Standalone paid apps require a separate codebase per app**, or at
   minimum a separate build target with its own asset bundle. This
   multiplies build/release/CI work as packs grow. Mitigated by sharing a
   single codebase with build-time configuration that selects which game
   pack(s) ship in each binary.

9. **Receipt validation for standalone paid apps is still our problem**
   (RevenueCat covers IAP, not paid-app downloads as cleanly). For the
   "register paid app ownership against household" flow in Phase 2, we
   either implement Apple/Google receipt validation directly or scope down
   to "paid apps work offline only, not surfaced cross-platform." The
   minimum viable launch is the latter.

10. **Apple's Small Business Program (15% rate)** requires sub-$1M annual
    revenue across all your apps and is an opt-in. We qualify trivially at
    launch but should plan for the cliff. Google has a similar 15% rate.

11. **Per-pack one-time pricing on the App Store has UX limits** —
    discoverability of "buy this small pack" is poor compared to
    "subscribe for everything." Watch conversion data; this is the leading
    indicator for switching emphasis to the Phase 3 subscription.

## Out of scope

- CMS authoring UI design (separate spec)
- Detailed mobile app architecture (separate spec when mobile work begins)
- COPPA/GDPR-K compliance review (separate workstream before mobile launch)
- Specific Stripe price/product structure, trial logic, gift codes
- Migration path from current Dexie/RxDB schema to the production schema
- Bookmarks/settings sync (deferred — Phase 1 keeps these local only)

## Acceptance for Phase 1

Phase 1 is complete when:

- [ ] A new user can sign up via Supabase Auth and lands in a household-of-one
- [ ] Authenticated users see their `game_history` sync between two browsers
      via RxDB replication
- [ ] An anonymous user can play offline indefinitely without any backend
      call (verified by network tab inspection)
- [ ] An admin can publish a `game_preset` with
      `required_product_id='premium_subscription'` and it is invisible to
      users without that entitlement but visible to those with it
- [ ] An admin can publish a `game_preset` with
      `required_product_id='math_pack_v1'` and it is gated by a one-time
      purchase entitlement of the matching `product_id`
- [ ] A successful Stripe **subscription** Checkout creates an active
      entitlement and unlocks matching presets within seconds, without
      requiring the user to log out and back in
- [ ] A successful Stripe **one-time** Checkout creates an entitlement with
      `expires_at = NULL` that grants perpetual access to the matching pack
- [ ] A canceled subscription continues to grant access until `expires_at`,
      then naturally filters out via RLS

Phases 2 and 3 will be specified in their own documents.
