import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import {
  getForceUpdateConfig,
  parseForceUpdateForm,
  upsertForceUpdateConfig,
} from "../lib/force-update.server";
import { authenticate } from "../shopify.server";

const FORM_ID = "force-update-settings";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const config = await getForceUpdateConfig(session.shop);
  return { config };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const nextConfig = parseForceUpdateForm(formData);
  const config = await upsertForceUpdateConfig(session.shop, nextConfig);
  return { ok: true, config };
};

export default function AppSettingsPage() {
  const { config } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const liveConfig = actionData?.config ?? config;

  return (
    <s-page heading="Settings">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => {
          const form = document.getElementById(FORM_ID) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      >
        Save settings
      </s-button>

      <s-section>
        <form id={FORM_ID} method="post">
          <s-stack direction="block" gap="large">
            {actionData?.ok ? (
              <s-banner tone="success" heading="Settings saved">
                <s-paragraph>
                  Force update configuration has been updated.
                </s-paragraph>
              </s-banner>
            ) : null}

            <s-card>
              <s-stack direction="block" gap="base">
                <s-heading>Force Update Configuration</s-heading>
                <s-paragraph>
                  Configure minimum app versions and store links for Android and
                  iOS.
                </s-paragraph>
              </s-stack>
            </s-card>

            <s-card>
              <s-stack direction="block" gap="base">
                <s-heading>Android</s-heading>
                <s-text-field
                  label="Android App Version"
                  name="androidAppVersion"
                  defaultValue={liveConfig.android.appVersion}
                  placeholder="e.g. 1.5.0"
                ></s-text-field>
                <s-text-field
                  label="Play Store URL"
                  name="androidStoreUrl"
                  defaultValue={liveConfig.android.storeUrl}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                ></s-text-field>
                <s-checkbox
                  label="Enable Force Update"
                  name="androidEnableForceUpdate"
                  defaultChecked={liveConfig.android.enableForceUpdate}
                ></s-checkbox>
              </s-stack>
            </s-card>

            <s-card>
              <s-stack direction="block" gap="base">
                <s-heading>iOS</s-heading>
                <s-text-field
                  label="iOS App Version"
                  name="iosAppVersion"
                  defaultValue={liveConfig.ios.appVersion}
                  placeholder="e.g. 1.5.0"
                ></s-text-field>
                <s-text-field
                  label="App Store URL"
                  name="iosStoreUrl"
                  defaultValue={liveConfig.ios.storeUrl}
                  placeholder="https://apps.apple.com/app/id..."
                ></s-text-field>
                <s-checkbox
                  label="Enable Force Update"
                  name="iosEnableForceUpdate"
                  defaultChecked={liveConfig.ios.enableForceUpdate}
                ></s-checkbox>
              </s-stack>
            </s-card>
          </s-stack>
        </form>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
