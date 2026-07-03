import db from "../db.server";

export type PlatformConfig = {
  appVersion: string;
  storeUrl: string;
  enableForceUpdate: boolean;
};

export type ForceUpdateConfig = {
  android: PlatformConfig;
  ios: PlatformConfig;
};

const DEFAULT_CONFIG: ForceUpdateConfig = {
  android: {
    appVersion: "",
    storeUrl: "",
    enableForceUpdate: false,
  },
  ios: {
    appVersion: "",
    storeUrl: "",
    enableForceUpdate: false,
  },
};

type Row = {
  shop: string;
  android_app_version: string | null;
  android_store_url: string | null;
  android_enable_force_update: boolean | null;
  ios_app_version: string | null;
  ios_store_url: string | null;
  ios_enable_force_update: boolean | null;
};

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function normalizeVersion(version: string) {
  const cleaned = (version || "").trim();
  return cleaned.startsWith("v") ? cleaned.slice(1) : cleaned;
}

function compareVersions(installed: string, required: string) {
  const left = normalizeVersion(installed).split(".").map((part) => Number(part) || 0);
  const right = normalizeVersion(required).split(".").map((part) => Number(part) || 0);
  const max = Math.max(left.length, right.length);

  for (let i = 0; i < max; i += 1) {
    const a = left[i] ?? 0;
    const b = right[i] ?? 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}

function rowToConfig(row: Row | null | undefined): ForceUpdateConfig {
  if (!row) return DEFAULT_CONFIG;

  return {
    android: {
      appVersion: row.android_app_version || "",
      storeUrl: row.android_store_url || "",
      enableForceUpdate: Boolean(row.android_enable_force_update),
    },
    ios: {
      appVersion: row.ios_app_version || "",
      storeUrl: row.ios_store_url || "",
      enableForceUpdate: Boolean(row.ios_enable_force_update),
    },
  };
}

export async function getForceUpdateConfig(shop: string): Promise<ForceUpdateConfig> {
  const rows = await db.$queryRaw<Row[]>`
    SELECT
      shop,
      android_app_version,
      android_store_url,
      android_enable_force_update,
      ios_app_version,
      ios_store_url,
      ios_enable_force_update
    FROM force_update_config
    WHERE shop = ${shop}
    LIMIT 1
  `;

  return rowToConfig(rows[0]);
}

export async function upsertForceUpdateConfig(
  shop: string,
  input: ForceUpdateConfig,
): Promise<ForceUpdateConfig> {
  await db.$executeRaw`
    INSERT INTO force_update_config (
      shop,
      android_app_version,
      android_store_url,
      android_enable_force_update,
      ios_app_version,
      ios_store_url,
      ios_enable_force_update,
      created_at,
      updated_at
    )
    VALUES (
      ${shop},
      ${input.android.appVersion},
      ${input.android.storeUrl},
      ${input.android.enableForceUpdate},
      ${input.ios.appVersion},
      ${input.ios.storeUrl},
      ${input.ios.enableForceUpdate},
      NOW(),
      NOW()
    )
    ON CONFLICT (shop)
    DO UPDATE SET
      android_app_version = EXCLUDED.android_app_version,
      android_store_url = EXCLUDED.android_store_url,
      android_enable_force_update = EXCLUDED.android_enable_force_update,
      ios_app_version = EXCLUDED.ios_app_version,
      ios_store_url = EXCLUDED.ios_store_url,
      ios_enable_force_update = EXCLUDED.ios_enable_force_update,
      updated_at = NOW()
  `;

  return getForceUpdateConfig(shop);
}

export function parseForceUpdateForm(formData: FormData): ForceUpdateConfig {
  return {
    android: {
      appVersion: String(formData.get("androidAppVersion") || "").trim(),
      storeUrl: String(formData.get("androidStoreUrl") || "").trim(),
      enableForceUpdate: parseBoolean(formData.get("androidEnableForceUpdate")),
    },
    ios: {
      appVersion: String(formData.get("iosAppVersion") || "").trim(),
      storeUrl: String(formData.get("iosStoreUrl") || "").trim(),
      enableForceUpdate: parseBoolean(formData.get("iosEnableForceUpdate")),
    },
  };
}

export function resolveForceUpdateDecision(
  config: ForceUpdateConfig,
  platform: string | null,
  installedVersion: string | null,
) {
  const normalized = (platform || "").toLowerCase();
  const target = normalized === "ios" ? config.ios : config.android;
  const requiresCheck =
    target.enableForceUpdate && target.appVersion && typeof installedVersion === "string";

  const shouldForceUpdate = requiresCheck
    ? compareVersions(installedVersion, target.appVersion) < 0
    : false;

  return {
    platform: normalized === "ios" ? "ios" : "android",
    requiredVersion: target.appVersion,
    installedVersion: installedVersion || "",
    forceUpdateEnabled: target.enableForceUpdate,
    shouldForceUpdate,
    updateUrl: target.storeUrl,
  };
}

