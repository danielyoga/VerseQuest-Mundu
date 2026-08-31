This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Bible Verse Schedule (monthly script)

The **`bible verse schedule`** tab in Google Sheets has columns such as Date, Book, Reading Selection, and **Verses**. To fetch passage text and fill the **Verses** column for the app (`/api/schedule-today`), run:

```bash
npm run gsheet:monthly
```

By default this targets the **current calendar month**. To run for a **specific month** (1–12), pass `--month` after `--` (required so npm forwards the flag to the script):

```bash
npm run gsheet:monthly -- --month 5
```

The example above fills rows for **May** (month `5`). Use `--force` to overwrite cells that already have Verses: `npm run gsheet:monthly -- --month 5 --force`.

Requires Google Sheets credentials (see `scripts/populate-schedule-verses.ts` and `package.json` `gsheet:monthly` for env setup).

## Devotion Admin (rich text editor)

The daily devotion is edited at `/admin/devotion` (phone-gated — see `isDevotionAdmin` in `lib/constants.ts`) and stored as one row per day in the `Devotion_and_Reflection` Google Sheet tab (no database).

- **Editor**: the devotion body is authored in a Lexical rich text editor (`components/admin/DevotionalEditor.tsx`) supporting bold, italic, H2/H3, bulleted/numbered lists, quote, and undo/redo. On save it's exported to HTML and stored directly in the sheet cell; the reader (`/devotional`) renders that HTML (sanitized server-side with DOMPurify in `app/api/devotion/today/route.ts`) instead of plain text.
- **Character limits**: title ≤ 200 chars, devotion body ≤ 5000 chars (measured as plain text, HTML markup excluded), enforced both client-side (live counter, blocks over the cap) and server-side (`app/api/devotion/save/route.ts` — closes a prior gap where only the UI enforced a max).
- **Legacy content**: rows saved before this feature are plain text with no HTML tags. Both the editor (on load) and the reader (on render) handle this transparently — plain text loads into the editor as ordinary paragraphs and renders identically to before.
- **Mobile preview toggle**: the admin form is responsive and full-width by default (useful since devotions are typically written on a laptop); a "Preview on mobile" toggle in the header temporarily constrains the form to phone width (390px) to check how it'll look for readers.
- **Rollback caveat**: admin + reader ship together in the same deploy, so there's no ordering concern when deploying this feature. The only risk is *reverting* the app after HTML content has already been saved — a pre-Lexical build has no HTML rendering and would show raw tags for any row saved after this shipped. If a rollback is ever needed, re-save the affected day(s) as plain text first.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
