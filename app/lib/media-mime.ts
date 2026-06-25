/** Shopify Files video formats: MP4, MOV, WEBM */
const VIDEO_EXTENSIONS: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".ogg": "video/ogg",
};

const IMAGE_EXTENSIONS: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".svg": "image/svg+xml",
};

function extensionOf(filename: string) {
  const match = filename.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

export function inferMimeType(file: Pick<File, "name" | "type">) {
  const type = file.type?.trim();
  if (type && type !== "application/octet-stream") {
    return type;
  }

  const ext = extensionOf(file.name);
  return VIDEO_EXTENSIONS[ext] || IMAGE_EXTENSIONS[ext] || type || "application/octet-stream";
}

export function isVideoMimeType(mimeType: string) {
  return mimeType.startsWith("video/");
}

export function isImageMimeType(mimeType: string) {
  return mimeType.startsWith("image/");
}

/** Re-attach a MIME type when the browser leaves `file.type` empty. */
export function withInferredMimeType(file: File) {
  const mimeType = inferMimeType(file);
  if (mimeType === file.type) {
    return file;
  }

  return new File([file], file.name, {
    type: mimeType,
    lastModified: file.lastModified,
  });
}
