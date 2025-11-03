import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

// Test if formidable loads
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const formidable = require('formidable');
    res.status(200).json({
      status: 'Formidable loaded successfully',
      version: formidable.formidable ? 'v3+' : 'v2'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'Formidable failed to load',
      error: error.message
    });
  }
}

