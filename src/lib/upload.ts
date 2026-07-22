import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_DIM = 512;

async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob failed"))), "image/jpeg", 0.9)!
  );
}

// Uploads to avatars/{targetUserId}/{timestamp}.jpg and returns a long-lived signed URL
export async function uploadAvatar(file: File, targetUserId: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Soubor musí být obrázek.");
  if (file.size > MAX_BYTES * 4) throw new Error("Obrázek je moc velký (max 8 MB před kompresí).");
  const blob = await resizeImage(file);
  if (blob.size > MAX_BYTES) throw new Error("Obrázek je i po kompresi přes 2 MB.");

  const path = `${targetUserId}/${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage.from("avatars")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (upErr) throw new Error(upErr.message);

  // Bucket is private; use a 100-year signed URL.
  const { data, error } = await supabase.storage.from("avatars")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 100);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Nelze získat URL.");
  return data.signedUrl;
}

// Uploads a news image. Path prefix used to group by author + timestamp.
export async function uploadNewsImage(file: File, authorId: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Soubor musí být obrázek.");
  const blob = file.size > MAX_BYTES ? await resizeImage(file) : file;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${authorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext === "png" ? "png" : "jpg"}`;
  const { error: upErr } = await supabase.storage.from("news")
    .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data, error } = await supabase.storage.from("news")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 100);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Nelze získat URL.");
  return data.signedUrl;
}
