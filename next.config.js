const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = withSentryConfig(nextConfig, {
  org: 'esn-expense-reimbursement',
  project: 'reimbursement-system',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: true,
  telemetry: false,
  tunnelRoute: '/api/sentry-tunnel',
  automaticVercelMonitors: false,

  // Never serve source maps to the browser (security + GDPR)
  hideSourceMaps: true,

  // Upload to Sentry then delete from bundle — never public
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
})
