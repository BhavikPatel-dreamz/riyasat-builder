import type { ForceUpdateConfig as ForceUpdateConfigRow } from "@prisma/client";

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

function rowToConfig(row: ForceUpdateConfigRow | null | undefined): ForceUpdateConfig {
  if (!row) return DEFAULT_CONFIG;

  return {
    android: {
      appVersion: row.androidAppVersion,
      storeUrl: row.androidStoreUrl,
      enableForceUpdate: row.androidEnableForceUpdate,
    },
    ios: {
      appVersion: row.iosAppVersion,
      storeUrl: row.iosStoreUrl,
      enableForceUpdate: row.iosEnableForceUpdate,
    },
  };
}

export async function getForceUpdateConfig(shop: string): Promise<ForceUpdateConfig> {
  const row = await db.forceUpdateConfig.findUnique({ where: { shop } });
  return rowToConfig(row);
}

export async function upsertForceUpdateConfig(
  shop: string,
  input: ForceUpdateConfig,
): Promise<ForceUpdateConfig> {
  const row = await db.forceUpdateConfig.upsert({
    where: { shop },
    create: {
      shop,
      androidAppVersion: input.android.appVersion,
      androidStoreUrl: input.android.storeUrl,
      androidEnableForceUpdate: input.android.enableForceUpdate,
      iosAppVersion: input.ios.appVersion,
      iosStoreUrl: input.ios.storeUrl,
      iosEnableForceUpdate: input.ios.enableForceUpdate,
    },
    update: {
      androidAppVersion: input.android.appVersion,
      androidStoreUrl: input.android.storeUrl,
      androidEnableForceUpdate: input.android.enableForceUpdate,
      iosAppVersion: input.ios.appVersion,
      iosStoreUrl: input.ios.storeUrl,
      iosEnableForceUpdate: input.ios.enableForceUpdate,
    },
  });

  return rowToConfig(row);
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
