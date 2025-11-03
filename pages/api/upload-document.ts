import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { parseDocument, truncateText } from '@/lib/document-parser';
import { extractLawInfoFromText } from '@/lib/sagemaker-client';
import { createLaw } from '@/lib/database';

// Disable body parser for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Upload and parse document to create law
 * POST /api/upload-document
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  console.log('\n========================================');
  console.log('📤 Document Upload & AI Extraction');
  console.log('📍 Environment:', process.env.NODE_ENV);
  console.log('📍 Lambda:', process.env.LAMBDA_TASK_ROOT ? 'YES' : 'NO');
  console.log('📍 AWS Region:', process.env.APP_REGION || 'NOT SET');
  console.log('========================================\n');

  try {
      // Parse the uploaded file
      console.log('Step 1: Parsing uploaded file...');
      const { file, text } = await parseUploadedFile(req);
      console.log(`✓ File received: ${file.originalFilename}`);
      console.log(`  - Size: ${file.size} bytes`);
      console.log(`  - Type: ${file.mimetype}`);
      console.log(`  - Path: ${file.filepath}`);

      // Parse document to extract text
      console.log('Step 2: Reading file buffer...');
      const fileBuffer = fs.readFileSync(file.filepath);
      console.log(`✓ Buffer read: ${fileBuffer.length} bytes`);
      
      console.log('Step 3: Parsing document to extract text...');
      const documentText = await parseDocument(fileBuffer, file.originalFilename || 'document.txt');
      console.log(`✓ Text extracted: ${documentText.length} chars`);
      
      // Truncate if too long
      console.log('Step 4: Truncating text...');
      const truncatedText = truncateText(documentText, 15000);
      console.log(`✓ Text ready: ${truncatedText.length} chars`);

      // Extract law information using AI model (4-call process)
      console.log('Step 5: Starting AI extraction (4 focused API calls)...');
      const lawData = await extractLawInfoFromText(truncatedText);
      console.log('✓ AI extraction completed');

      // Create the law in Aurora DSQL
      console.log('Step 6: Creating law in Aurora DSQL...');
      
      const lawToCreate = {
        jurisdiction: lawData.jurisdiction || 'Unknown',
        status: validateStatus(lawData.status),
        sector: lawData.sector || 'General',
        impact: validateImpact(lawData.impact),
        confidence: validateConfidence(lawData.confidence),
        published: lawData.published || new Date().toISOString().split('T')[0],
        affected: 0,
        stocks_impacted: {
          STOCK_IMPACTED: []
        }
      };

      const createdLaw = await createLaw(lawData.lawId, lawToCreate);
      console.log(`✓ Law created: ${lawData.lawId}`);
      console.log('========================================');

      // Clean up uploaded file
      try {
        fs.unlinkSync(file.filepath);
      } catch (e) {
        // Ignore cleanup errors
      }

      return res.status(201).json({
        success: true,
        message: 'Document processed and law created successfully with AI extraction',
        data: {
          lawId: lawData.lawId,
          extractedData: lawData,
          createdLaw,
          documentInfo: {
            filename: file.originalFilename,
            size: file.size,
            textLength: documentText.length,
            apiCallsMade: 4
          }
        }
      });

  } catch (error: any) {
    console.error('\n✗ Upload failed at some step');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Full error:', error);
    console.log('========================================');
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Document processing failed',
      step: error.message?.includes('Step') ? error.message.split(':')[0] : 'Unknown',
    });
  }
}

/**
 * Parse uploaded file using formidable
 */
function parseUploadedFile(req: NextApiRequest): Promise<{ file: formidable.File; text?: string }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max
      keepExtensions: true,
      // For AWS Lambda/Amplify, use /tmp directory
      uploadDir: process.env.LAMBDA_TASK_ROOT ? '/tmp' : undefined,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(new Error(`File upload error: ${err.message}`));
        return;
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      
      if (!file) {
        reject(new Error('No file uploaded'));
        return;
      }

      resolve({ file });
    });
  });
}

/**
 * Validation helpers
 */
function validateStatus(status: any): string {
  const valid = ['Active', 'Pending', 'Expired'];
  if (valid.includes(status)) {
    return status;
  }
  return 'Pending';
}

function validateConfidence(confidence: any): string {
  const valid = ['High', 'Medium', 'Low'];
  if (valid.includes(confidence)) {
    return confidence;
  }
  return 'Medium';
}

function validateImpact(impact: any): number {
  const num = parseInt(impact);
  if (isNaN(num)) return 5;
  if (num < 0) return 0;
  if (num > 10) return 10;
  return num;
}

