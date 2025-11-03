import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { parseDocument, truncateText } from '@/lib/document-parser';
import { extractLawInfoFromText } from '@/lib/sagemaker-client';
import { createLaw } from '@/lib/database';

// Disable Next.js body parser for multipart/form-data
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true, // Tell Next.js we handle the response
  },
};

// Ensure upload directory exists on Lambda
function getUploadDir(): string {
  const uploadDir = process.env.LAMBDA_TASK_ROOT ? '/tmp' : './tmp';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers before any async operations
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const uploadDir = getUploadDir();
  
  const form = formidable({
    maxFileSize: 10 * 1024 * 1024,
    keepExtensions: true,
    uploadDir: uploadDir,
    filename: (name, ext) => `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`,
  });

  return new Promise<void>((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ success: false, error: 'File parsing failed', details: err.message });
        resolve();
        return;
      }

      let tempFilePath: string | null = null;

      try {
        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file || !file.filepath) {
          res.status(400).json({ success: false, error: 'No file uploaded' });
          resolve();
          return;
        }

        tempFilePath = file.filepath;
        const fileBuffer = fs.readFileSync(tempFilePath);
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

        res.status(201).json({
          success: true,
          data: {
            lawId: lawData.lawId,
            createdLaw
          }
        });

      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message || 'Processing failed'
        });
      } finally {
        // Cleanup
        if (tempFilePath) {
          try { fs.unlinkSync(tempFilePath); } catch (e) {}
        }
        resolve();
      }
    });
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

