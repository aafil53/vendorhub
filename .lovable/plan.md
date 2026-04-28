# Split RFQ Inbox & Quotations + add Quotation PDF download

## Goal

- **RFQ Inbox** → only **active, actionable RFQs** (status `open`, no bid yet by this vendor, deadline not passed).
- **Quotations** → full **bid history** styled like screenshot 2, with a working **PDF download**.

## Backend changes (`backend/src/routes/rfq.js`)

1. **New `GET /api/rfq/vendor-bids`** — returns every bid by `req.user.id` joined with RFQ + Equipment + Client + Order. Shape:
   ```
   { bidId, quoteId:"QT-2024-018", rfqId, rfqRef:"RFQ-2024-031",
     equipmentName, equipmentCategory, buyerName,
     amount, availability, submittedAt, validUntil (=rfq.deadline),
     status: 'submitted'|'won'|'lost'|'revised', rfqStatus }
   ```
   Status: `bid.status='accepted'` → `won`; `'rejected'` or RFQ awarded to other vendor → `lost`; otherwise `submitted`.

2. **New `GET /api/rfq/bids/:bidId/pdf`** — generates a quotation PDF on the fly using `pdfkit` (already light, no new system deps). Streams `application/pdf` with filename `Quotation-QT-XXXX.pdf`. Auth-guarded: only the bid's vendor can download. Includes header, vendor + buyer info, equipment, amount, availability, submitted date, valid-until, status, and a footer.

3. **Tighten `GET /api/rfq/vendor-rfqs`** — exclude RFQs where this vendor already submitted a bid, and exclude expired ones. Those now belong to Quotations.

4. Add `pdfkit` to `backend/package.json` dependencies.

## Frontend changes

### `src/pages/vendor/RFQInbox.tsx`
- Drop "Quoted" tab/stat and the `quoted/won/declined` filter options.
- Stats become: **Total Active · New · Accepted · Expiring <24h**.
- Subtitle: "Active RFQs awaiting your response."

### `src/pages/vendor/Quotations.tsx` (rebuilt to match screenshot 2)
- New query `vendor-bids` → `/rfq/vendor-bids`.
- KPI cards (left-border accent, icon chip): **Total Bids · Won · In Progress · Win Rate**.
- Pill filter chips with counts: **All Quotations · Draft · Submitted · Revised · Won · Lost**. Active chip = indigo fill.
- Table columns exactly per screenshot:
  `QUOTE ID | RFQ REF | EQUIPMENT (name + category subtitle) | BUYER | AMOUNT | SUBMITTED | VALID UNTIL | STATUS | ACTIONS`
- Status dot+label: Submitted=blue, Won=green, Lost=red, Draft=gray, Revised=amber.
- Actions: `View` (always), `Submit` indigo button (Draft only — wired later), download icon button → `GET /rfq/bids/:bidId/pdf` via authenticated fetch, blob → `URL.createObjectURL` → trigger `<a download>`.
- Search input top-right.
- Live refresh on socket `notification:new` and `bid:status-changed`.
- Empty state when no bids exist.

### Helper
- Add `src/lib/downloadFile.ts` with `downloadAuthedBlob(url, filename)` that uses the same axios `api` instance (`responseType:'blob'`) so the JWT header is included.

## Out of scope

- Real "Draft" bid persistence — UI supports the status, count stays 0 until draft saving lands.
- "Submit" action wiring for drafts (button shows but no-op for now).

## Files touched

- `backend/package.json` — add `pdfkit`
- `backend/src/routes/rfq.js` — `/vendor-bids`, `/bids/:bidId/pdf`, tighten `/vendor-rfqs`
- `src/pages/vendor/RFQInbox.tsx` — strip submitted/quoted views
- `src/pages/vendor/Quotations.tsx` — full rebuild per screenshot
- `src/lib/downloadFile.ts` — new auth-aware blob downloader
