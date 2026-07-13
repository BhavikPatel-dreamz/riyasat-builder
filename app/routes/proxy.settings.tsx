import type { LoaderFunctionArgs } from "react-router";

import { getForceUpdateConfig } from "../lib/force-update.server";
import { authenticate } from "../shopify.server";

/**
 * Signed App Proxy endpoint for settings.
 *
 * Storefront URL: https://{shop}.myshopify.com/apps/cms/settings
 * Returns the force update config as JSON for the mobile app.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);

  const shop =
    session?.shop ?? new URL(request.url).searchParams.get("shop") ?? "";

  if (!shop) {
    return Response.json({ error: "Shop could not be resolved." }, { status: 400 });
  }

  const config = await getForceUpdateConfig(shop);

  return Response.json({ success: true, config });
};
