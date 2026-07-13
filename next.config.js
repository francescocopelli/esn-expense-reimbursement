const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Instrumentation hook must be explicitly enabled in Next.js 15
  experimental: {
    instrumentationHook: true,
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: true,
  widenClientFileUpload: true,

  // Hide source maps from browser (security + GDPR)
  hideSourceMaps: true,

  // Delete source maps after upload so they are never served publicly
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Disable Sentry build telemetry
  telemetry: false,

  // Tunnel Sentry requests through our API route
  tunnelRoute: '/api/sentry-tunnel',

  automaticVercelMonitors: false,
})
