import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { gutenbergBlockKitVite } from 'gutenberg-block-kit/vite';


// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the Vite server.
// The CLI will eventually stop passing in HOST,
// so we can remove this workaround after the next major release.
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT!) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    allowedHosts: [host],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    // Fix: html-react-parser bundled inside gutenberg-block-kit has a var hoisting bug.
    // `var react_1 = React` inside a __commonJSMin closure is shadowed by a later
    // `var React = { ... }` declaration, making react_1 = undefined.
    // This plugin rewrites it to use the namespace import (React$4) which can't be shadowed.
    {
      name: "fix-gutenberg-react-shadow",
      transform(code: string, id: string) {
        if (!id.includes("gutenberg-block-kit/dist/App-")) return;
        return code.replace(
          /var react_1 = React;/g,
          "var react_1 = (typeof React$4 !== 'undefined' ? React$4 : React);"
        );
      },
    },
    reactRouter(),
    tsconfigPaths(),
    gutenbergBlockKitVite()
  ],
  build: {
    assetsInlineLimit: 0,
  },
  resolve: {
    dedupe: ["react", "react-dom", "react-router", "@wordpress/element"],
  },
  optimizeDeps: {
    include: [
      "@shopify/app-bridge-react",
    ],
    exclude: [
      "gutenberg-block-kit/editor",
    ],
  },
}) satisfies UserConfig;
