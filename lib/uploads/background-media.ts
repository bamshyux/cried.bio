const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "application/mp4",
]);

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"];

export function isBackgroundVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const path = url.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export function isBackgroundVideoFile(file: File): boolean {
  if (file.type && VIDEO_MIME_TYPES.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function isBackgroundImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const name = file.name.toLowerCase();
  return /\.(jpe?g|png|webp|gif)$/i.test(name);
}

export function resolveBackgroundUploadKind(file: File): "video" | "image" | null {
  if (isBackgroundVideoFile(file)) return "video";
  if (isBackgroundImageFile(file)) return "image";
  return null;
}

export function backgroundUploadContentType(file: File, kind: "video" | "image"): string {
  if (kind === "video") return "video/mp4";
  if (file.type.startsWith("image/")) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export function backgroundStorageExtension(kind: "video" | "image", file: File): string {
  if (kind === "video") return "mp4";
  const fromMime = file.type.split("/")[1]?.replace("jpeg", "jpg");
  if (fromMime) return fromMime;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  if (name.endsWith(".gif")) return "gif";
  return "jpg";
}

export function resolveBackgroundMediaTypeFromUrl(
  mediaUrl: string,
  mediaType: "image" | "video",
): "image" | "video" {
  return isBackgroundVideoUrl(mediaUrl) ? "video" : mediaType;
}

type BackgroundMediaFields = {
  background_type: string;
  background_image_url: string | null;
  background_video_url: string | null;
};

/** Fix rows where MP4 was saved under image fields (common on Windows uploads). */
export function normalizeBackgroundMediaFields<T extends BackgroundMediaFields>(settings: T): T {
  let background_type = settings.background_type;
  let background_image_url = settings.background_image_url;
  let background_video_url = settings.background_video_url;

  if (!background_video_url && isBackgroundVideoUrl(background_image_url)) {
    background_video_url = background_image_url;
    background_image_url = null;
    background_type = "video";
  }

  if (background_video_url) {
    background_type = "video";
    if (isBackgroundVideoUrl(background_image_url)) {
      background_image_url = null;
    }
  } else if (background_image_url && background_type === "video") {
    background_type = "image";
  }

  return {
    ...settings,
    background_type,
    background_image_url,
    background_video_url,
  };
}

type EnterGateMediaFields = {
  enter_gate_background_type: string;
  enter_gate_background_image_url: string | null;
  enter_gate_background_video_url: string | null;
};

export function normalizeEnterGateMediaFields<T extends EnterGateMediaFields>(settings: T): T {
  let enter_gate_background_type = settings.enter_gate_background_type;
  let enter_gate_background_image_url = settings.enter_gate_background_image_url;
  let enter_gate_background_video_url = settings.enter_gate_background_video_url;

  if (
    !enter_gate_background_video_url &&
    isBackgroundVideoUrl(enter_gate_background_image_url)
  ) {
    enter_gate_background_video_url = enter_gate_background_image_url;
    enter_gate_background_image_url = null;
    enter_gate_background_type = "video";
  }

  if (enter_gate_background_video_url) {
    enter_gate_background_type = "video";
    if (isBackgroundVideoUrl(enter_gate_background_image_url)) {
      enter_gate_background_image_url = null;
    }
  } else if (enter_gate_background_image_url && enter_gate_background_type === "video") {
    enter_gate_background_type = "image";
  }

  return {
    ...settings,
    enter_gate_background_type,
    enter_gate_background_image_url,
    enter_gate_background_video_url,
  };
}

export function resolveProfileBackgroundMedia(settings: BackgroundMediaFields): {
  kind: "video" | "image" | null;
  url: string | null;
} {
  const normalized = normalizeBackgroundMediaFields(settings);

  if (normalized.background_type === "video" && normalized.background_video_url) {
    return { kind: "video", url: normalized.background_video_url };
  }

  if (normalized.background_type === "image" && normalized.background_image_url) {
    return { kind: "image", url: normalized.background_image_url };
  }

  if (normalized.background_video_url) {
    return { kind: "video", url: normalized.background_video_url };
  }

  if (normalized.background_image_url) {
    return {
      kind: isBackgroundVideoUrl(normalized.background_image_url) ? "video" : "image",
      url: normalized.background_image_url,
    };
  }

  return { kind: null, url: null };
}
