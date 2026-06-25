// @ts-nocheck
/** Client-side media upload helper shared by blocks with custom file inputs. */

const VIDEO_EXTENSIONS = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.ogg': 'video/ogg',
};

function inferMimeType(file) {
  const type = file.type?.trim();
  if (type && type !== 'application/octet-stream') {
    return type;
  }

  const match = file.name.toLowerCase().match(/\.[^.]+$/);
  const ext = match?.[0] ?? '';
  return VIDEO_EXTENSIONS[ext] || type || 'application/octet-stream';
}

export function withInferredMimeType(file) {
  const mimeType = inferMimeType(file);
  if (mimeType === file.type) {
    return file;
  }

  return new File([file], file.name, {
    type: mimeType,
    lastModified: file.lastModified,
  });
}

export async function uploadCmsMediaFile(file) {
  const body = new FormData();
  body.append('file', withInferredMimeType(file));

  const response = await fetch('/api/cms/media', {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to upload media.');
  }

  return response.json();
}

/** Shopify Files video formats. */
export const SHOPIFY_VIDEO_ACCEPT =
  '.mp4,.m4v,.mov,.webm,video/mp4,video/quicktime,video/webm';
