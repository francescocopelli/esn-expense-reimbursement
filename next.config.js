const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: true,
  telemetry: false,
  tunnelRoute: '/api/sentry-tunnel',
  automaticVercelMonitors: false,
  hideSourceMaps: true,

  // SOURCE MAP UPLOAD DISABLED
  // Re-enable once SENTRY_ORG and SENTRY_PROJECT are verified on sentry.io
  // Set to false to re-enable
  sourcemaps: {
    disable: true,
  },
})
