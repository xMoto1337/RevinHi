# SEO on revinhi.com

What's in place, how to add a guide page, and the things only you can do (off-site).

## What's done

**Every page**
- A unique title (60 characters or less) and meta description (155 or less), a canonical URL, and Open Graph and
  Twitter tags with the product's icon, all from `pageMetadata()` in `lib/seo.ts`.
- One H1 per page, then H2 and H3 in order.
- The site footer (`components/SiteFooter.tsx`) links every product and every guide. The top bar has a Guides tab.

**Product pages** (`/3d`, `/pdf`, `/recovery`, `/performance`, `/desktop`)
- The main search phrase, in plain words, is in the title, the H1 and the first paragraph:
  - "3D modeling app for Windows"
  - "PDF editor for Windows"
  - "file recovery software" and "recover deleted files"
  - "Windows game optimizer", "FPS" and "input lag"
  - "live wallpaper app"
- SoftwareApplication JSON-LD with operating system, category, offers with prices and downloadUrl. The helper is
  `softwareAppLd()` in `lib/seo.ts`, and the Microsoft Store listing is in `sameAs` for 3D.
- FAQPage JSON-LD wherever a page has an FAQ.
- A "How to" list of that product's guides.

**Home**: Organization and WebSite JSON-LD, a title and description that name the apps, and a link to `/guides`.

**Guide pages**: there are 23, plus the `/guides` index. Each has:
- an H1 matching the search
- numbered steps with real app screenshots where they exist
- an FAQ with FAQPage JSON-LD, and BreadcrumbList JSON-LD
- HowTo JSON-LD on the step-by-step pages
- links to the other guides for that product

**Sitemap and robots**
- `app/sitemap.ts` lists the home page, every product, `/guides`, every guide (read from `lib/guides.ts`, so new
  guides are added automatically), privacy and terms.
- `app/robots.ts` allows everything except `/admin` and `/api/`, and points to `https://revinhi.com/sitemap.xml`.

**Speed (LCP)**
- Images use `next/image`, served as webp/avif at the right sizes.
- Only the first image on a page is loaded early (`preload` / `fetchPriority`); the rest load as you scroll.
- Videos below the top of the page (home cards, PDF demos, Desktop trailer) use `components/LazyVideo.tsx`: the
  poster shows first and the video only downloads when you scroll near it.
- The /3d hero is now a real screenshot instead of the illustration.

**Microsoft Store**: on /3d, the 3D guides and the home 3D card, Microsoft's official Store badge sits next to
Download free. It's set by `msStoreUrl` in `lib/products.ts`, so another app gets it by adding its Store link there.
The 3D free vs Pro export sentence lives in `lib/3d-copy.ts`.

Left out on purpose: there's no "Acrobat alternative" page. An earlier commit (b7136c1) removed that page and every
Adobe mention, and the old address redirects to /pdf.

## How to add a guide page

1. Add a line to `lib/guides.ts`: `{ product: "recovery", slug: "my-new-guide", label: "...", blurb: "..." }`.
   That adds it to the sitemap, `/guides`, the footer and the product's guide list.
2. Create `app/(store)/<product route>/<slug>/page.tsx`. Copy a sibling guide:
   - 3D: `ThreeDGuide`, e.g. `app/(store)/3d/lithophane-maker/page.tsx`
   - PDF: `GuidePage` with a `faq` prop, e.g. `app/(store)/pdf/password-protect-pdf/page.tsx`
   - Recovery, Performance, Desktop: `ProductGuide`, e.g. `app/(store)/recovery/recover-sd-card-photos/page.tsx`
3. Give it:
   - a title of 60 characters or less and a description of 155 or less, through `pageMetadata` with
     `path: "/<route>/<slug>"`
   - an H1 that matches how people search
   - three to six steps
   - an FAQ
4. For screenshots, save a compressed webp (1600 px wide is plenty) in `public/<product>/screens/` and add it to
   `components/threed/ThreeDGuide.tsx` (`SHOTS`) or `components/guides/shots.ts`, with alt text describing what's
   on screen.
5. Only name features that exist in the app (check the app's store `LISTING.md` or source). Don't add made-up
   numbers, reviews or comparisons.
6. Run `npm run build`. Then check the title and description lengths, for example with View Source on the page.

## Your to-do list (off-site)

### 1. Search engine verification and sitemap

- **Bing: done.** `public/BingSiteAuth.xml` verifies the site in Bing Webmaster Tools.
  - In Bing Webmaster Tools, go to Sitemaps, then Submit sitemap, and enter `https://revinhi.com/sitemap.xml`.
  - You can also import the site from Google Search Console there.
- **Google: probably already verified.** `public/google17a71e2cebed7c44.html` is the HTML-file method and it's live.
  1. Open [Google Search Console](https://search.google.com/search-console) and check that `https://revinhi.com` shows
     as verified.
  2. If it isn't verified, use the "HTML tag" method instead. Copy only the `content="..."` value from the tag Google
     gives you.
  3. In Vercel, go to Project, then Settings, then Environment Variables, and add `GOOGLE_SITE_VERIFICATION` with that
     value.
  4. Redeploy, then click Verify.
  5. Then go to Sitemaps, enter `sitemap.xml` and submit it.
  6. Use URL Inspection, then Request indexing, for `/3d`, `/pdf`, `/recovery` and `/guides` to speed things up.
- **Optional:** `BING_SITE_VERIFICATION` does the same for Bing's meta-tag method (it outputs `msvalidate.01`), but
  you don't need it while the XML file is there.

### 2. Directory listings (free backlinks and real traffic)

Apply with the same name, description and link each time, so search engines link them together. Use the short
description and screenshots from each app's `store/LISTING.md`. Be truthful about the price: for example "Free,
Pro $9.99 one-time".

| Where | What to submit | Notes |
|---|---|---|
| [AlternativeTo](https://alternativeto.net) | One entry per app. List each one as an alternative to the apps people already search for, like Meshmixer or Tinkercad for 3D, PDF editors for PDF, and Recuva or Disk Drill for Recovery. Pick its license as "Freemium". | It ranks very well for "X alternative" searches. Add screenshots, the Windows platform, and tags like "offline" and "no subscription". |
| [Softpedia](https://www.softpedia.com/user/submit.shtml) | Each app's installer link (`https://revinhi.com/api/download/<slug>`), description, version and screenshots. | They test for malware and give a "100% clean" badge. Re-submit on major versions. |
| [MajorGeeks](https://www.majorgeeks.com/content/page/submit_software.html) | The same as Softpedia. They prefer utilities, so Recovery and Performance fit best. | It's an editor-picked site, so a short, honest description works best. |
| [Product Hunt](https://www.producthunt.com) | One launch per app. 3D and Recovery are the strongest. | Launch on a Tuesday to Thursday, with a short demo GIF, a first comment explaining the free tier, and the Store link for 3D. |
| [Microsoft Store](https://apps.microsoft.com/detail/9NFFN0J610J5) | 3D is live. Recovery has a listing ready in `revinhi-recovery/store/LISTING.md`. | Store pages rank in Google and Bing, and they link back to revinhi.com. |
| [Uptodown](https://en.uptodown.com/developers), [FileHorse](https://www.filehorse.com/submit/), [TechSpot downloads](https://www.techspot.com/downloads/) | Installer link, description, screenshots. | They're slower to accept, but each listing is a lasting link. |
| [Printables](https://www.printables.com) and [Thingiverse](https://www.thingiverse.com) (3D) | Post a few real models made in RevinHi 3D, like a lithophane or a split vase, and name the app in the description. | Don't spam. Post models that are useful in their own right. |
| Reddit (r/3Dprinting, r/datarecovery, r/pcgaming) | Answer questions where the app genuinely helps, and say you made it. | Read each subreddit's self-promotion rules first. |

What to put in each listing:
- **Name**: e.g. RevinHi 3D.
- **One line**: the tagline from `lib/products.ts`.
- **Description**: from `store/LISTING.md`.
- **Category**: 3D/CAD, PDF/Office, Data recovery, System tuning or Desktop customization.
- **OS**: Windows 10/11 64-bit.
- **Price**: Free with optional one-time Pro (Performance is paid only).
- **Homepage**: `https://revinhi.com/<route>`.
- **Download**: `https://revinhi.com/api/download/<slug>`.
- **Screenshots**: `public/3d/screens`, `public/recovery/screens`, and the Desktop gallery.

### 3. Every few weeks

- In Search Console, open Performance, then Search results, to see which searches show your pages. Make a guide for
  any search that's getting impressions but doesn't have a page yet.
- Fix anything listed under Pages, then "Why pages aren't indexed".
