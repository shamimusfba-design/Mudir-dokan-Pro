# MudirDokan Pro (মুদির দোকান) — Bangladesh Grocery POS & Digital Khata

An offline-first Progressive Web App (PWA) for grocery stores, general stores, and mini-supermarkets in Bangladesh, combining high-speed counter POS billing, weighted-average inventory costing, supplier purchase ledgers, and an advanced Customer Digital Khata with a dedicated Customer Self-Service Portal (`/portal`).

## Key Capabilities

- **Bangladesh FMCG Starter Catalog**: Automatically provisions 28 Bangladeshi grocery categories, 18 major FMCG brands (PRAN, Fresh, ACI, Square, Bashundhara, Akij, Teer, Unilever, Marico, Nestlé, Coca-Cola, PepsiCo, Olympic, Danish, Igloo, Bombay Sweets, Dekko, Local/Loose), and 50 ready-to-sell SKUs with carton/sack/pack conversion units on first sign-in.
- **High-Speed Counter POS (`/`)**:
  - Barcode scanner (`Enter`), instant bilingual search (English & Bangla), quick category filter, and loose-item weight/fraction support (`0.25`, `0.5`, `1`, `1.5`, `2` kg).
  - Keyboard shortcuts (`F2` focus search, `F4` hold bill, `F8` checkout, `Esc` reset).
  - Split payments (`Cash`, `bKash`, `Nagad`, `Rocket`, `Card`, `Bank`) and strict credit sales enforcement (no anonymous credit sales; every `Due > 0` links to a registered customer with an expected payment date).
  - Printable bilingual thermal (`58mm` / `80mm`) and `A4` receipts plus WhatsApp summary sharing.
- **Offline-First PWA & Sync**:
  - Local IndexedDB catalog caching and offline sales queue powered by Dexie.js + Workbox service worker (`vite-plugin-pwa`).
  - Automatic idempotent cloud synchronization (`clientTransactionUuid`) when internet reconnects.
- **Purchases, Suppliers & Weighted-Average Costing**:
  - Multi-unit purchase conversion (carton/sack to base units), proportional landed cost (transport + labor), and atomic Weighted Average Cost recalculation.
  - Supplier ledger, partial/full supplier payments, and purchase returns.
- **Advanced Customer Digital Khata & Due Management**:
  - Auto-generated customer IDs (`CUST-0001`), full BD address fields (Village, Area, Road, House), customer tiers (`Regular`, `VIP`, `Wholesale`), credit limits, and quick customer creation directly from POS checkout.
  - Immutable customer transaction ledger (`Opening Balance`, `Credit Sale`, `Partial Payment`, `Full Payment`, `Sales Return`, `Balance Adjustment`) with audited adjustment logs.
  - Multi-invoice payment allocation (auto-FIFO or custom split) with printable payment receipts.
  - Due dashboard with 5 aging buckets (`0–7`, `8–15`, `16–30`, `31–60`, `60+` Days), customer lifetime analytics, and WhatsApp/SMS reminder logs.
- **Customer Self-Service Portal (`/portal`)**:
  - Mobile-friendly customer portal accessible via `/portal` or QR/invitation links (`/portal?invite=<token>`).
  - Isolated Mobile OTP session authentication with strict customer-safe API responses (never exposes purchase costs, profit margins, COGS, suppliers, or other customers).
  - Customers can view outstanding balances, invoices, payment receipts, printable account statements, and submit invoice inquiries/disputes.
- **Profit, Expenses & Cash Register**:
  - Daily operating expenses across 10 Bangladeshi shop categories, opening/closing cash register reconciliation, and role-gated (`OWNER`, `MANAGER`, `CASHIER`) Gross/Net Profit and CSV export reports.

## Architecture & Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Dexie.js (IndexedDB), `vite-plugin-pwa`.
- **Backend**: Express (`server.ts`) on port `3000`, Zod validation, `decimal.js` for exact currency/cost math.
- **Database**: PostgreSQL (Cloud SQL) with Drizzle ORM (`src/db/schema.ts`, 37 normalized tables).
- **Authentication**: Firebase Authentication (Google Sign-In for shopkeepers) + isolated HMAC-signed OTP sessions for the `/portal` customer portal.

## Local Setup & Scripts

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (see `.env.example` for `APP_URL`, `PORTAL_SESSION_SECRET`, and PostgreSQL connection settings managed by the host environment).
3. Push database schema (when managing PostgreSQL directly):
   ```bash
   npx drizzle-kit push --config=src/db/drizzle.config.ts
   ```
4. Start development server on port `3000`:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   npm run start
   ```

## Security Notes

- Staff endpoints under `/api/*` verify Firebase ID tokens and scope every query to the authenticated user's `storeId`.
- Customer portal endpoints under `/api/portal/*` use isolated customer session tokens and return only customer-safe fields (no cost prices, COGS, profit, or supplier records).
- Financial transactions (sales, payments, returns, ledger entries) are immutable; corrections create explicit audited adjustment entries.
