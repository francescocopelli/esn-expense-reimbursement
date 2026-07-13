const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // instrumentation.ts is available by default in Next.js 15 — no flag needed
}

// Only wrap with Sentry if auth token is present (avoids build failure in forks / missing env)
const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,

  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
    // Skip upload entirely if the auth token or project slug is missing
    disable: !process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG || !process.env.SENTRY_PROJECT,
  },

  telemetry: false,
  tunnelRoute: '/api/sentry-tunnel',
  automaticVercelMonitors: false,
}

module.exports = withSentryConfig(nextConfig, sentryBuildOptions)
