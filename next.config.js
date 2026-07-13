const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // your existing Next.js options here
}

module.exports = withSentryConfig(nextConfig, {
  // Sentry build-time options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps only in CI/production — keeps local builds fast
  silent: true,
  widenClientFileUpload: true,

  // Do NOT expose source maps to the browser (security + GDPR)
  hideSourceMaps: true,

  // Disable Sentry telemetry about build stats
  telemetry: false,

  // Tunnel Sentry requests through our own API to avoid ad-blockers
  // and to avoid exposing the DSN in client JS bundles
  tunnelRoute: '/api/sentry-tunnel',

  // Disable the automatic Sentry instrumentation on Vercel OIDC
  automaticVercelMonitors: false,
})
