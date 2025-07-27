const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const { configureRuntimeEnv } = require("next-runtime-env/build/configure");

configureRuntimeEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },
  reactStrictMode: false,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  transpilePackages: [
    "@helicone-package/cost",
    "@helicone-package/llm-mapper",
  ],
  webpack: (config, { dev, isServer }) => {
    // GraphQL loader
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      loader: "graphql-tag/loader",
    });
    config.resolve.extensions.push(".graphql");

    // Optimize bundle size in production
    if (!dev && !isServer) {
      // Split chunks for better caching
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Monaco Editor chunk
          monaco: {
            test: /[\\/]node_modules[\\/](@monaco-editor|monaco-editor)[\\/]/,
            name: "monaco",
            chunks: "all",
            priority: 30,
          },
          // Chart libraries chunk
          charts: {
            test: /[\\/]node_modules[\\/](@tremor\/react|recharts)[\\/]/,
            name: "charts",
            chunks: "all",
            priority: 25,
          },
          // UI libraries chunk
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|framer-motion)[\\/]/,
            name: "ui",
            chunks: "all",
            priority: 20,
          },
          // Vendor chunk for other large libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: "all",
            priority: 10,
            minSize: 100000,
          },
        },
      };

      // Tree shake unused exports
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },
  async redirects() {
    return [
      {
        source: "/api/graphql/download-schema",
        destination: "/api-public-schema.graphql",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ];
  },
  experimental: {
    appDir: true,
    runtime: "experimental-edge",
  },
};

module.exports = withBundleAnalyzer(nextConfig);

// Injected content via Sentry wizard below
if (process.env.REGION === "us") {
  const { withSentryConfig } = require("@sentry/nextjs");

  module.exports = withSentryConfig(module.exports, {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: "helicone-ai",
    project: "javascript-nextjs",
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  });
}
