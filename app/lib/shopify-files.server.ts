import { createMediaRecord } from "./cms.server";
import { inferMimeType, isVideoMimeType } from "./media-mime";

type ShopifyAdminClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export type MediaItem = {
  id: string;
  url: string;
  alt?: string;
  title?: string;
  mimeType?: string;
  type?: "image" | "video" | "file";
  width?: number;
  height?: number;
};

type ListImagesInput = {
  page: number;
  perPage: number;
  search?: string;
};

type ListImagesResult = {
  items: MediaItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

type VideoSourceNode = {
  url?: string | null;
  mimeType?: string | null;
  format?: string | null;
  width?: number | null;
  height?: number | null;
};

type FileNode = {
  id: string;
  alt?: string | null;
  mimeType?: string | null;
  fileStatus?: string | null;
  image?: {
    url?: string | null;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  url?: string | null;
  originalSource?: VideoSourceNode | null;
  sources?: VideoSourceNode[] | null;
};

const FILE_TYPE_FIELDS = `
  ... on MediaImage {
    mimeType
    image {
      url
      altText
      width
      height
    }
  }
  ... on GenericFile {
    mimeType
    url
  }
  ... on Video {
    originalSource {
      url
      mimeType
      width
      height
      format
    }
    sources {
      url
      mimeType
      width
      height
      format
    }
  }
`;

const FILE_FIELDS = `
  id
  alt
  fileStatus
  ${FILE_TYPE_FIELDS}
`;

const LIST_FILES_QUERY = `#graphql
  query CmsListFiles($first: Int!, $after: String, $query: String) {
    files(
      first: $first
      after: $after
      query: $query
      sortKey: CREATED_AT
      reverse: true
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ${FILE_FIELDS}
        }
      }
    }
  }`;

const STAGED_UPLOADS_MUTATION = `#graphql
  mutation CmsStagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }`;

const FILE_CREATE_MUTATION = `#graphql
  mutation CmsFileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        ${FILE_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }`;

const FILE_STATUS_QUERY = `#graphql
  query CmsFileStatus($id: ID!) {
    node(id: $id) {
      ... on File {
        ${FILE_FIELDS}
      }
    }
  }`;

function pickVideoSource(node: FileNode): {
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
} | null {
  const sources = node.sources ?? [];
  const mp4 =
    sources.find((source) => source.format === "mp4") ??
    sources.find((source) => source.mimeType?.includes("mp4"));

  if (mp4?.url) {
    return {
      url: mp4.url,
      mimeType: mp4.mimeType ?? "video/mp4",
      width: mp4.width ?? undefined,
      height: mp4.height ?? undefined,
    };
  }

  if (node.originalSource?.url) {
    return {
      url: node.originalSource.url,
      mimeType: node.originalSource.mimeType ?? "video/mp4",
      width: node.originalSource.width ?? undefined,
      height: node.originalSource.height ?? undefined,
    };
  }

  const first = sources.find((source) => source.url);
  if (first?.url) {
    return {
      url: first.url,
      mimeType: first.mimeType ?? "video/mp4",
      width: first.width ?? undefined,
      height: first.height ?? undefined,
    };
  }

  return null;
}

function toMediaItem(node: FileNode): MediaItem | null {
  const video = pickVideoSource(node);
  if (video) {
    return {
      id: node.id,
      url: video.url,
      alt: node.alt || undefined,
      title: node.alt || undefined,
      mimeType: video.mimeType,
      type: "video",
      width: video.width,
      height: video.height,
    };
  }

  const imageUrl = node.image?.url;
  if (imageUrl) {
    return {
      id: node.id,
      url: imageUrl,
      alt: node.image?.altText || node.alt || undefined,
      title: node.alt || undefined,
      mimeType: node.mimeType || "image/jpeg",
      type: "image",
      width: node.image?.width ?? undefined,
      height: node.image?.height ?? undefined,
    };
  }

  const fileUrl = node.url;
  if (!fileUrl) {
    return null;
  }

  const mimeType = node.mimeType || "application/octet-stream";
  return {
    id: node.id,
    url: fileUrl,
    alt: node.alt || undefined,
    title: node.alt || undefined,
    mimeType,
    type: isVideoMimeType(mimeType) ? "video" : "file",
  };
}

export async function listImages(
  admin: ShopifyAdminClient,
  shop: string,
  { page, perPage, search = "" }: ListImagesInput,
): Promise<ListImagesResult> {
  const term = search.trim();
  const query = term ? `filename:*${term}*` : undefined;
  const targetIndex = (page - 1) * perPage;

  let after: string | undefined;
  let cursor = 0;
  const collected: MediaItem[] = [];
  let hasNextPage = true;

  while (hasNextPage && collected.length < targetIndex + perPage) {
    const response = await admin.graphql(LIST_FILES_QUERY, {
      variables: {
        first: Math.min(perPage, 50),
        after,
        query,
      },
    });

    const json = await response.json();
    const connection = json.data?.files;

    if (!connection) {
      break;
    }

    for (const edge of connection.edges ?? []) {
      const item = toMediaItem(edge.node);
      if (!item) continue;

      if (cursor >= targetIndex && collected.length < perPage) {
        collected.push(item);
      }

      cursor += 1;
    }

    hasNextPage = connection.pageInfo?.hasNextPage ?? false;
    after = connection.pageInfo?.endCursor ?? undefined;

    if (!hasNextPage) {
      break;
    }
  }

  const total = cursor;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return {
    items: collected,
    total,
    page,
    perPage,
    totalPages,
  };
}

async function pollFileUntilReady(
  admin: ShopifyAdminClient,
  id: string,
  {
    attempts = 10,
    delayMs = 600,
    isVideo = false,
  }: { attempts?: number; delayMs?: number; isVideo?: boolean } = {},
): Promise<MediaItem | null> {
  const maxAttempts = isVideo ? Math.max(attempts, 30) : attempts;
  const waitMs = isVideo ? Math.max(delayMs, 1000) : delayMs;

  for (let i = 0; i < maxAttempts; i += 1) {
    const response = await admin.graphql(FILE_STATUS_QUERY, {
      variables: { id },
    });
    const json = await response.json();
    const node = json.data?.node as FileNode | undefined;

    if (node) {
      if (node.fileStatus === "FAILED") {
        return null;
      }

      const item = toMediaItem(node);
      if (item) {
        return item;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  return null;
}

async function uploadToStagedTarget(
  target: {
    url: string;
    parameters: Array<{ name: string; value: string }>;
  },
  file: File,
) {
  const formData = new FormData();

  for (const parameter of target.parameters) {
    formData.append(parameter.name, parameter.value);
  }

  formData.append("file", file);

  const uploadResponse = await fetch(target.url, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Failed to upload file to Shopify storage (${uploadResponse.status}).`,
    );
  }
}

export async function uploadImage(
  admin: ShopifyAdminClient,
  shop: string,
  file: File,
): Promise<MediaItem> {
  const mimeType = inferMimeType(file);
  const isVideo = isVideoMimeType(mimeType);
  const stagedResource = isVideo ? "VIDEO" : "IMAGE";
  const contentType = isVideo ? "VIDEO" : "IMAGE";

  const stagedResponse = await admin.graphql(STAGED_UPLOADS_MUTATION, {
    variables: {
      input: [
        {
          filename: file.name,
          mimeType,
          resource: stagedResource,
          fileSize: String(file.size),
          httpMethod: "POST",
        },
      ],
    },
  });

  const stagedJson = await stagedResponse.json();
  const stagedTarget = stagedJson.data?.stagedUploadsCreate?.stagedTargets?.[0];
  const stagedErrors = stagedJson.data?.stagedUploadsCreate?.userErrors ?? [];

  if (!stagedTarget || stagedErrors.length > 0) {
    throw new Error(
      stagedErrors[0]?.message || "Failed to create staged upload target.",
    );
  }

  await uploadToStagedTarget(stagedTarget, file);

  const createResponse = await admin.graphql(FILE_CREATE_MUTATION, {
    variables: {
      files: [
        {
          alt: file.name,
          contentType,
          originalSource: stagedTarget.resourceUrl,
        },
      ],
    },
  });

  const createJson = await createResponse.json();
  const createdFile = createJson.data?.fileCreate?.files?.[0] as
    | FileNode
    | undefined;
  const createErrors = createJson.data?.fileCreate?.userErrors ?? [];

  if (!createdFile || createErrors.length > 0) {
    throw new Error(createErrors[0]?.message || "Failed to create Shopify file.");
  }

  const item =
    toMediaItem(createdFile) ??
    (await pollFileUntilReady(admin, createdFile.id, { isVideo }));

  if (!item) {
    throw new Error(
      isVideo
        ? "Video was uploaded but is still processing. Try again in a moment."
        : "Shopify file was created without a public URL.",
    );
  }

  await createMediaRecord(shop, {
    shopifyFileId: item.id,
    url: item.url,
    alt: item.alt,
    title: item.title,
    mimeType: item.mimeType,
  });

  return item;
}
