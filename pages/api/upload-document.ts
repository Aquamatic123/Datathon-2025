import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { parseDocument, truncateText } from '@/lib/document-parser';
import { extractLawInfoFromText } from '@/lib/sagemaker-client';
import { createLaw } from '@/lib/database';

// CRITICAL: Disable Next.js body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Force JSON response header immediately
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const form = formidable({
    maxFileSize: 10 * 1024 * 1024,
    keepExtensions: true,
    uploadDir: process.env.LAMBDA_TASK_ROOT ? '/tmp' : undefined,
  });

  // Use callback API - more reliable on Lambda
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable error:', err);
      res.status(500).json({ success: false, error: 'File upload failed' });
      return;
    }

    try {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const fileBuffer = fs.readFileSync(file.filepath);
      const documentText = await parseDocument(fileBuffer, file.originalFilename || 'document.txt');
      const truncatedText = truncateText(documentText, 15000);
      const lawData = await extractLawInfoFromText(truncatedText);

      const lawToCreate = {
        jurisdiction: lawData.jurisdiction || 'Unknown',
        status: validateStatus(lawData.status),
        sector: lawData.sector || 'General',
        impact: validateImpact(lawData.impact),
        confidence: validateConfidence(lawData.confidence),
        published: lawData.published || new Date().toISOString().split('T')[0],
        affected: 0,
        stocks_impacted: { STOCK_IMPACTED: [] }
      };

      const createdLaw = await createLaw(lawData.lawId, lawToCreate);

      try { fs.unlinkSync(file.filepath); } catch (e) {}

      res.status(201).json({
        success: true,
        data: {
          lawId: lawData.lawId,
          createdLaw
        }
      });

    } catch (error: any) {
      console.error('Processing error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Upload failed'
      });
    }
  });
}

function validateStatus(status: any): string {
  const valid = ['Active', 'Pending', 'Expired'];
  return valid.includes(status) ? status : 'Pending';
}

function validateConfidence(confidence: any): string {
  const valid = ['High', 'Medium', 'Low'];
  return valid.includes(confidence) ? confidence : 'Medium';
}

function validateImpact(impact: any): number {
  const num = parseInt(impact);
  if (isNaN(num)) return 5;
  if (num < 0) return 0;
  if (num > 10) return 10;
  return num;
}

