CREATE TABLE IF NOT EXISTS "force_update_config" (
  "shop" TEXT PRIMARY KEY,
  "android_app_version" TEXT NOT NULL DEFAULT '',
  "android_store_url" TEXT NOT NULL DEFAULT '',
  "android_enable_force_update" BOOLEAN NOT NULL DEFAULT false,
  "ios_app_version" TEXT NOT NULL DEFAULT '',
  "ios_store_url" TEXT NOT NULL DEFAULT '',
  "ios_enable_force_update" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

