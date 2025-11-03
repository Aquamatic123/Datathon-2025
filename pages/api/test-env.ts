import { NextApiRequest, NextApiResponse } from 'next';

// Test environment variables
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'Environment check',
    isLambda: !!process.env.LAMBDA_TASK_ROOT,
    hasDbEndpoint: !!process.env.AURORA_DSQL_ENDPOINT,
    hasSageMaker: !!process.env.SAGEMAKER_ENDPOINT_NAME,
    hasRegion: !!process.env.APP_REGION,
    nodeVersion: process.version,
    platform: process.platform,
  });
}

