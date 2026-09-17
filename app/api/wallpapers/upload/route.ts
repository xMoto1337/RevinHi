import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, WALLPAPERS_BUCKET } from "@/lib/supabase";

const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200MB - generous for a short looping wallpaper clip
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".mkv"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];

/**
 * Multipart upload used by both the admin page (manual single uploads) and the Pexels import
 * script (bulk, one call per clip) - same path either way, so moderation always sees everything
 * that lands, regardless of where it came from.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  const title = form.get("title");
  const tagsRaw = form.get("tags"); // comma-separated
  const source = (form.get("source") as string | null) ?? "upload";
  const sourceAttribution = form.get("sourceAttribution") as string | null;
  const uploaderEmail = form.get("uploaderEmail") as string | null;

  if (!(file instanceof File) || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ ok: false, error: "missing_file_or_title" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }

  const extension = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  const type = VIDEO_EXTENSIONS.includes(extension) ? "video" : IMAGE_EXTENSIONS.includes(extension) ? "image" : null;
  if (!type) {
    return NextResponse.json({ ok: false, error: "unsupported_file_type" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const storagePath = `${crypto.randomUUID()}${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(WALLPAPERS_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });

  if (uploadError) {
    console.error("Wallpaper storage upload failed:", uploadError);
    return NextResponse.json({ ok: false, error: "storage_upload_failed" }, { status: 502 });
  }

  const tags = typeof tagsRaw === "string"
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const { data, error: insertError } = await supabase
    .from("wallpapers")
    .insert({
      title: title.trim(),
      type,
      storage_path: storagePath,
      tags,
      source,
      source_attribution: sourceAttribution?.trim() || null,
      uploader_email: uploaderEmail?.trim() || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Wallpaper DB insert failed:", insertError);
    // Best-effort cleanup so a failed insert doesn't leave an orphaned file with nothing pointing to it.
    await supabase.storage.from(WALLPAPERS_BUCKET).remove([storagePath]);
    return NextResponse.json({ ok: false, error: "db_insert_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
