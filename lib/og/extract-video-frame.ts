import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const VIDEO_FETCH_TIMEOUT_MS = 20_000;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

/** Stable pseudo-random seek per video URL so OG previews stay consistent when cached. */
export function pickVideoSeekSeconds(videoUrl: string): number {
  let hash = 0;
  for (let i = 0; i < videoUrl.length; i++) {
    hash = (hash * 31 + videoUrl.charCodeAt(i)) >>> 0;
  }
  return 0.5 + (hash % 7500) / 1000;
}

async function downloadVideo(videoUrl: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VIDEO_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(videoUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "cried.bio-og/1.0" },
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.startsWith("text/")) return null;

    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > MAX_VIDEO_BYTES) return null;
    return Buffer.from(bytes);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg binary unavailable"));
      return;
    }

    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
    });
  });
}

export async function extractVideoFrameAsJpeg(
  videoUrl: string,
  seekSeconds: number,
): Promise<Buffer | null> {
  if (!ffmpegPath) return null;

  const videoBuffer = await downloadVideo(videoUrl);
  if (!videoBuffer) return null;

  const dir = await mkdtemp(join(tmpdir(), "cried-og-video-"));
  const inputPath = join(dir, "input.bin");
  const outputPath = join(dir, "frame.jpg");

  try {
    await writeFile(inputPath, videoBuffer);
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      seekSeconds.toFixed(3),
      "-i",
      inputPath,
      "-vframes",
      "1",
      "-q:v",
      "3",
      "-y",
      outputPath,
    ]);
    return await readFile(outputPath);
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function extractOgVideoBackgroundFrame(videoUrl: string): Promise<Buffer | null> {
  const trimmed = videoUrl.trim();
  if (!trimmed) return null;

  const primarySeek = pickVideoSeekSeconds(trimmed);
  const seekAttempts = [primarySeek, 0.25, 1, 0];

  for (const seek of seekAttempts) {
    const frame = await extractVideoFrameAsJpeg(trimmed, seek);
    if (frame?.byteLength) return frame;
  }

  return null;
}
