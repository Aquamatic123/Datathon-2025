import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    success: true,
    message: 'Upload endpoint is reachable',
    env: {
      nodeEnv: process.env.NODE_ENV,
      isLambda: !!process.env.LAMBDA_TASK_ROOT,
      region: process.env.APP_REGION || 'NOT SET',
      hasDbEndpoint: !!process.env.AURORA_DSQL_ENDPOINT,
      hasSageMaker: !!process.env.SAGEMAKER_ENDPOINT_NAME,
      hasCredentials: !!(process.env.APP_ACCESS_KEY_ID && process.env.APP_SECRET_ACCESS_KEY),
    }
  });
}

