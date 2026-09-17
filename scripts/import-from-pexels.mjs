// Bulk-seeds the wallpaper marketplace from Pexels' video API - free, generous rate limits,
// license explicitly allows this kind of reuse (no attribution legally required, but we record
// the photographer credit anyway as good practice - see source_attribution in the DB row).
//
// Usage:
//   PEXELS_API_KEY=... SITE_URL=http://localhost:3000 node scripts/import-from-pexels.mjs
//
// Everything lands as "pending" (same as a manual admin upload) - nothing goes live until
// approved on /admin/wallpapers. Run against SITE_URL=http://localhost:3000 while `npm run dev`
// is running locally, or against your deployed URL once it's live.

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
const PER_QUERY = Number(process.env.PER_QUERY ?? "10");

if (!PEXELS_API_KEY) {
  console.error("Set PEXELS_API_KEY first - get a free key at https://www.pexels.com/api/");
  process.exit(1);
}

// Wallpaper-Engine-style aesthetic categories - tuned for loop-able, ambient, not-too-busy clips.
const QUERIES = [
  "abstract particles loop",
  "space nebula",
  "ocean waves aerial",
  "city night timelapse",
  "rain window",
  "clouds timelapse",
  "forest ambient",
  "northern lights",
  "fire embers",
  "underwater",
  "neon lights abstract",
  "galaxy stars",
];

async function searchPexels(query, perPage) {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) {
    throw new Error(`Pexels search failed for "${query}": ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.videos ?? [];
}

function pickVideoFile(video) {
  // Prefer something around 1080p - full 4K originals are unnecessarily large for a background loop.
  const files = [...video.video_files].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return files.find((f) => (f.width ?? 0) >= 1280 && f.file_type === "video/mp4") ?? files.at(-1);
}

async function uploadToMarketplace({ title, tags, attribution, fileUrl }) {
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) {
    throw new Error(`Failed to download ${fileUrl}: ${fileRes.status}`);
  }
  const blob = await fileRes.blob();

  const form = new FormData();
  form.set("title", title);
  form.set("tags", tags.join(","));
  form.set("source", "pexels");
  form.set("sourceAttribution", attribution);
  form.set("file", blob, "clip.mp4");

  const res = await fetch(`${SITE_URL}/api/wallpapers/upload`, { method: "POST", body: form });
  const json = await res.json();
  if (!json.ok) {
    throw new Error(`Upload rejected: ${JSON.stringify(json)}`);
  }
  return json.id;
}

async function main() {
  let imported = 0;
  let failed = 0;

  for (const query of QUERIES) {
    console.log(`\n--- ${query} ---`);
    const videos = await searchPexels(query, PER_QUERY);

    for (const video of videos) {
      const file = pickVideoFile(video);
      if (!file) {
        continue;
      }

      const title = query.replace(/\b\w/g, (c) => c.toUpperCase());
      const attribution = `Video by ${video.user?.name ?? "Pexels contributor"} on Pexels`;

      try {
        const id = await uploadToMarketplace({
          title,
          tags: [query.split(" ")[0]],
          attribution,
          fileUrl: file.link,
        });
        console.log(`  imported ${id} (${video.id})`);
        imported++;
      } catch (err) {
        console.error(`  FAILED (video ${video.id}):`, err.message);
        failed++;
      }
    }

    // Pexels rate limit is generous (200 req/hour on the free tier) but this keeps us well clear.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\nDone. Imported ${imported}, failed ${failed}.`);
}

main();
