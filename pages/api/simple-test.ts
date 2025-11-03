import { NextApiRequest, NextApiResponse } from 'next';

// Simplest possible test - no libraries, no async, nothing
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'API is working',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

