/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Explicitly expose environment variables for AWS Amplify
  // These will be available via process.env in API routes and server-side code
  env: {
    AURORA_DSQL_ENDPOINT: process.env.AURORA_DSQL_ENDPOINT,
    APP_REGION: process.env.APP_REGION,
    DATABASE_NAME: process.env.DATABASE_NAME,
    APP_ACCESS_KEY_ID: process.env.APP_ACCESS_KEY_ID,
    APP_SECRET_ACCESS_KEY: process.env.APP_SECRET_ACCESS_KEY,
    SAGEMAKER_ENDPOINT_NAME: process.env.SAGEMAKER_ENDPOINT_NAME,
  },
}

module.exports = nextConfig

