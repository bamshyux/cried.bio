"use client";

import { ensureStorageUploadLimitsAction } from "@/app/actions/settings";
import { createClient } from "@/lib/supabase/client";
import { uploadSizeError } from "@/lib/uploads/limits";
import {
  isStorageSizeError,
  mapMusicStorageUploadError,
} from "@/lib/uploads/storage-upload-error";

const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "webm", "mpeg"]);

function getAudioExtension(file: File): string {
  const fromType = file.type.split("/")[1]?.replace("mpeg", "mp3");
  if (fromType && AUDIO_EXTENSIONS.has(fromType)) return fromType;

  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && AUDIO_EXTENSIONS.has(fromName)) {
    return fromName === "mpeg" ? "mp3" : fromName;
  }

  return "mp3";
}

function getAudioContentType(file: File): string {
  if (file.type.startsWith("audio/")) return file.type;

  const ext = getAudioExtension(file);
  switch (ext) {
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "webm":
      return "audio/webm";
    default:
      return "audio/mpeg";
  }
}

function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return !!ext && AUDIO_EXTENSIONS.has(ext);
}

async function removeExistingMusicFiles(userId: string) {
  const supabase = createClient();
  const { data: files } = await supabase.storage.from("music").list(userId);
  if (!files?.length) return;

  const paths = files
    .filter((file) => file.name.startsWith("track."))
    .map((file) => `${userId}/${file.name}`);

  if (paths.length > 0) {
    await supabase.storage.from("music").remove(paths);
  }
}

async function performMusicUpload(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  await removeExistingMusicFiles(user.id);

  const ext = getAudioExtension(file);
  const path = `${user.id}/track.${ext}`;

  const { error } = await supabase.storage
    .from("music")
    .upload(path, file, { upsert: true, contentType: getAudioContentType(file) });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("music").getPublicUrl(path);

  return `${publicUrl}?v=${Date.now()}`;
}

function finalizeUploadError(error: unknown, file: File, maxUploadBytes: number): Error {
  const message = error instanceof Error ? error.message : "Upload failed.";
  if (isStorageSizeError(message)) {
    return new Error(mapMusicStorageUploadError(file.size, maxUploadBytes));
  }
  return error instanceof Error ? error : new Error(message);
}

export async function uploadMusicToStorage(file: File, maxUploadBytes: number): Promise<string> {
  if (file.size === 0) {
    throw new Error("Please select an audio file.");
  }

  if (file.size > maxUploadBytes) {
    throw new Error(uploadSizeError(file.size, maxUploadBytes));
  }

  if (!isAudioFile(file)) {
    throw new Error("Upload MP3, WAV, OGG, or WebM audio.");
  }

  await ensureStorageUploadLimitsAction();

  try {
    return await performMusicUpload(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    if (file.size <= maxUploadBytes && isStorageSizeError(message)) {
      await ensureStorageUploadLimitsAction();
      try {
        return await performMusicUpload(file);
      } catch (retryError) {
        throw finalizeUploadError(retryError, file, maxUploadBytes);
      }
    }
    throw finalizeUploadError(error, file, maxUploadBytes);
  }
}
