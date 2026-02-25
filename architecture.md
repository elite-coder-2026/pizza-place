# Architecture (pizza-place)

This repo contains:
- **Frontend**: a static site in `client/` (HTML + CSS + vanilla JS + jQuery).
- **Backend**: a placeholder `backend/` folder. The frontend is already wired for an optional JSON API.

The intent is a simple, reliable stack: static UI + small API + **raw PostgreSQL** (no ORM), with clear boundaries and minimal moving parts.

## Goals
- Keep the frontend fast and mostly static.
- Keep the backend small: a handful of endpoints that accept JSON and write to Postgres.
- Use **parameterized SQL** via a connection pool (raw `pg`), store money as integer cents, and use transactions where needed.

## Frontend architecture

### Pages + responsibilities
- `client/index.html`: marketing/home, includes menu filters + testimonials UI.
- `client/menu.html`: menu browsing; category filtering.
- `client/order.html`: order form UI; computes totals client-side; submits order JSON.
- `client/cms-test.html`: a UI sandbox/test page (tabs + scroll-to-top).

### Styling
- Source CSS lives in `client/css/`.
- Shared design constants should come from `client/css/design-tokens.css`.
- Preferred convention for new styling classes is BEM: `.block__element--modifier`.

### JavaScript modules

**Core form wiring**
- `client/js/forms.js` exposes `window.PizzaPlaceFormCore.wireForm(defaults)`:
  - Reads payload via jQuery `serializeArray()`
  - Validates required fields + email format + honeypot (`_hp`)
  - Submits JSON via `axios`
  - Updates a status element (`role="status"`, `aria-live="polite"`) and disables controls while in-flight

**Form instances**
- `client/js/contact-form.js` posts to `POST /api/contact`
- `client/js/reservation-form.js` posts to `POST /api/reservations`
- `client/js/order-form.js` posts to `POST /api/orders` and adds:
  - line item parsing
  - subtotal calculation in cents (`subtotal_cents`, `unit_cents`, `line_cents`)
  - fulfillment logic (`pickup` vs `delivery`) and delivery-field gating

**Non-form UI**
- `client/js/menu.js`: category filters and a lightweight testimonials “slider” enhancement.
- `client/js/cms-test.js`: tab switching + scroll-to-top.

### Frontend ↔ API contract (current expectations)
All form submissions send JSON and expect a JSON response shaped like:
- `200 OK` with `{ ok: true, message?: string }`
- errors may return `{ ok: false, message: string }` (the client displays `message`)

Client-side “spam” behavior:
- Honeypot field name: `_hp`
- If `_hp` is non-empty, the client blocks submission with “Spam detected.”

## Backend architecture (recommended)

### Overview
Implement a small HTTP JSON API (Node) and write to PostgreSQL using raw SQL.

Recommended approach:
- Node server (e.g. Express) in `backend/`
- `pg` connection pool
- Route handlers that:
  1) validate input
  2) call query functions (raw SQL, parameterized)
  3) return `{ ok, message }` consistently

Optional but useful:
- `GET /api/health` for uptime checks

### API endpoints

#### `POST /api/contact`
Accepts contact messages.

Suggested request body:
- `name` (string, required)
- `email` (string, required)
- `message` (string, required)
- `_client`, `_ts` (strings, optional; included by frontend)

Suggested response:
- `{ ok: true, message: "Message sent. Thanks!" }`

#### `POST /api/reservations`
Accepts reservation requests.

Suggested request body:
- `name` (string, required)
- `email` (string, required)
- `message` (string, required)
- `reservation_date` (string, required; ISO date preferred)
- `reservation_time` (string, required; 24h time preferred)
- `guests` (string/number, required)
- `consent` (string; required by frontend)

Suggested response:
- `{ ok: true, message: "Reservation sent. Thanks!" }`

#### `POST /api/orders`
Accepts orders with computed totals.

Suggested request body (subset):
- `customer_name` (string, required)
- `email` (string, required)
- `fulfillment` (`"pickup"` | `"delivery"`, required)
- Delivery fields (required if fulfillment=`delivery`):
  - `address_1`, `city`, `zip`
- `items` (array, required) where each item includes:
  - `size` (`sm|md|lg`)
  - `crust` (string)
  - `toppings` (string[])
  - `quantity` (number)
  - `unit_cents` (number)
  - `line_cents` (number)
- `subtotal_cents` (number)

Notes:
- Treat client totals as *untrusted* input; recompute server-side (same pricing rules) or validate consistency.

### PostgreSQL (raw SQL) design

#### Principles
- Use `pg.Pool` and **parameterized queries** (`$1`, `$2`, …).
- Store money as `integer` cents.
- Use `timestamptz` for timestamps.
- Use a transaction when writing an order + its line items.

#### Suggested tables
This is a minimal schema that matches the current frontend payload shape.

```sql
-- Contact messages
create table if not exists contact_messages (
  id bigserial primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Reservations
create table if not exists reservations (
  id bigserial primary key,
  name text not null,
  email text not null,
  message text not null,
  reservation_at timestamptz not null,
  guests integer not null,
  created_at timestamptz not null default now()
);

-- Orders (header)
create table if not exists orders (
  id bigserial primary key,
  customer_name text not null,
  email text not null,
  fulfillment text not null check (fulfillment in ('pickup','delivery')),
  address_1 text,
  city text,
  zip text,
  subtotal_cents integer not null,
  created_at timestamptz not null default now()
);

-- Order items (lines)
create table if not exists order_items (
  id bigserial primary key,
  order_id bigint not null references orders(id) on delete cascade,
  size text not null check (size in ('sm','md','lg')),
  crust text not null,
  toppings text[] not null default '{}',
  quantity integer not null check (quantity > 0),
  unit_cents integer not null,
  line_cents integer not null
);

create index if not exists idx_reservations_reservation_at on reservations(reservation_at);
create index if not exists idx_orders_created_at on orders(created_at);
```

#### Reservations datetime
The frontend sends `reservation_date` and `reservation_time` separately. The backend should combine them into `reservation_at` in a consistent timezone policy:
- Simplest: treat inputs as the restaurant’s local timezone and store as `timestamptz`.
- Document the assumed timezone in configuration (e.g. `RESTAURANT_TZ=America/New_York`).

### Backend validation + consistency checks
Suggested minimum checks:
- Validate required fields and basic formats (email, positive guests/quantities).
- Enforce delivery fields when `fulfillment === "delivery"`.
- For orders:
  - recompute `unit_cents`, `line_cents`, and `subtotal_cents` on the server, or
  - validate them against server rules and reject mismatches.

### Error handling + responses
Keep responses consistent with the frontend expectations:
- Success: `200` with `{ ok: true, message }`
- Validation: `400` with `{ ok: false, message }`
- Server/DB: `500` with `{ ok: false, message: "Sorry—something went wrong. Please try again." }`

### Security + hardening (small but valuable)
- Always parameterize SQL (no string concatenation).
- Add basic rate limiting on POST endpoints (to protect email/DB and reduce spam).
- If the frontend and API are on different origins, configure CORS explicitly.
- Never return raw database errors to the client; log them server-side.

## Deployment shape
Two common deployment models:
1) **Separate**: host `client/` as static files (CDN) and run API separately (Node + Postgres).
2) **Single**: Node serves static assets from `client/` and also hosts `/api/*`.

## Diagrams
There is a simple diagram at `client/docs/diagrams/architecture.mmd` rendered via `cd client && npm run diagram`.

