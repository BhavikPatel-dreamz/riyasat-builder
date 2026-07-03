import type { LoaderFunctionArgs } from "react-router";

import {
  getForceUpdateConfig,
  resolveForceUpdateDecision,
} from "../lib/force-update.server";
import { authenticate } from "../shopify.server";

/**
 * Signed App Proxy endpoint for mobile force-update checks.
 *
 * Storefront URL: https://{shop}.myshopify.com/apps/cms/force-update
 * Query params:
 *  - platform: android | ios
 *  - version: installed app version
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);

  const shop = session?.shop ?? url.searchParams.get("shop") ?? "";
  if (!shop) {
    return Response.json({ error: "Shop could not be resolved." }, { status: 400 });
  }

  const platform = url.searchParams.get("platform");
  const version = url.searchParams.get("version");
  const config = await getForceUpdateConfig(shop);
  const decision = resolveForceUpdateDecision(config, platform, version);

  return Response.json(
    {
      success: true,
      config,
      forceUpdate: decision,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    },
  );
};

