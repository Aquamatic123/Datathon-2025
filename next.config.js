/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Explicitly expose environment variables for AWS Amplify
  env: {
    AURORA_DSQL_ENDPOINT: process.env.AURORA_DSQL_ENDPOINT,
    APP_REGION: process.env.APP_REGION,
    DATABASE_NAME: process.env.DATABASE_NAME,
    APP_ACCESS_KEY_ID: process.env.APP_ACCESS_KEY_ID,
    APP_SECRET_ACCESS_KEY: process.env.APP_SECRET_ACCESS_KEY,
    SAGEMAKER_ENDPOINT_NAME: process.env.SAGEMAKER_ENDPOINT_NAME,
  },
  
  // Increase API route timeout for file processing
  experimental: {
    proxyTimeout: 300000, // 5 minutes
  },
  
  // Configure for serverless deployment
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle these on server
      config.externals = config.externals || [];
      config.externals.push({
        bufferutil: 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      });
    }
    return config;
  },
}

module.exports = nextConfig

