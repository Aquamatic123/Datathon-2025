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
 * 
 * IMPORTANT: This function has a global try-catch to ensure we ALWAYS return JSON
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CRITICAL: Set JSON response header FIRST to prevent HTML error pages
  res.setHeader('Content-Type', 'application/json');
  
  // Global error boundary - catches ANY error including Next.js errors
  try {
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

    // Inner try-catch for the main logic
    try {
      // Parse the uploaded file
      const { file, text } = await parseUploadedFile(req);

      console.log(`📄 File received: ${file.originalFilename}`);
      console.log(`  - Size: ${file.size} bytes`);
      console.log(`  - Type: ${file.mimetype}`);

      // Parse document to extract text
      const fileBuffer = fs.readFileSync(file.filepath);
      const documentText = await parseDocument(fileBuffer, file.originalFilename || 'document.txt');
      
      // Truncate if too long
      const truncatedText = truncateText(documentText, 15000);

      console.log(`📝 Extracted text from document:`);
      console.log(`  - Original length: ${documentText.length} chars`);
      console.log(`  - Truncated length: ${truncatedText.length} chars`);

      // Extract law information using AI model (4-call process)
      console.log('\n🤖 Starting AI extraction (4 focused API calls)...');
      console.log('  Call 1: Jurisdiction & Status');
      console.log('  Call 2: Date & Title');
      console.log('  Call 3: Sector & Impact');
      console.log('  Call 4: Summary');
      console.log('  Strategy: Extract real values from AI, not defaults\n');
      
      const lawData = await extractLawInfoFromText(truncatedText);

      // Log extracted data
      console.log('\n✅ AI extraction process completed!');
      console.log('  Extracted fields:');
      console.log('  - Law ID:', lawData.lawId);
      console.log('  - Title:', lawData.title);
      console.log('  - Jurisdiction:', lawData.jurisdiction);
      console.log('  - Status:', lawData.status);
      console.log('  - Sector:', lawData.sector);
      console.log('  - Impact:', lawData.impact);
      console.log('  - Confidence:', lawData.confidence);
      console.log('  - Published:', lawData.published);
      console.log('\n  Full data:', JSON.stringify(lawData, null, 2));

      // Create the law in Aurora DSQL
      console.log('\n💾 Creating law in Aurora DSQL...');
      
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

      console.log('✅ Law created successfully!');
      console.log('  - Law ID:', lawData.lawId);
      console.log('  - Sector:', lawToCreate.sector);
      console.log('  - Impact:', lawToCreate.impact);
      console.log('\n========================================\n');

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
      console.error('\n✗ Document upload failed!');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('Error details:', JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.code,
        syscall: error.syscall
      }));
      console.log('\n========================================\n');

      // Ensure we always return JSON
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Document processing failed',
        details: error.toString(),
        errorType: error.name || 'UnknownError'
      });
    }
  } catch (unexpectedError: any) {
    // Global error handler - catches even Next.js errors
    console.error('\n🔥 UNEXPECTED ERROR (Global Handler)');
    console.error('Error:', unexpectedError.message);
    console.error('Stack:', unexpectedError.stack);
    console.error('Type:', unexpectedError.constructor.name);
    
    // Force JSON response
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(500).json({
      success: false,
      error: 'Unexpected server error',
      message: unexpectedError.message || 'Unknown error',
      details: unexpectedError.toString(),
      type: unexpectedError.constructor.name,
      hint: 'Check CloudWatch logs for full details'
    });
  }
}

/**
 * Parse uploaded file using formidable
 */
function parseUploadedFile(req: NextApiRequest): Promise<{ file: formidable.File; text?: string }> {
  return new Promise((resolve, reject) => {
    console.log('📦 Initializing formidable...');
    
    try {
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB max
        keepExtensions: true,
        // For AWS Lambda/Amplify, use /tmp directory
        uploadDir: process.env.LAMBDA_TASK_ROOT ? '/tmp' : undefined,
      });

      console.log('📦 Parsing multipart form data...');

      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('❌ Formidable parse error:', err);
          reject(new Error(`File upload error: ${err.message}`));
          return;
        }

        console.log('📦 Form parsed successfully');
        console.log('  - Fields:', Object.keys(fields));
        console.log('  - Files:', Object.keys(files));

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        
        if (!file) {
          console.error('❌ No file found in upload');
          reject(new Error('No file uploaded'));
          return;
        }

        console.log('✅ File parsed successfully');
        resolve({ file });
      });
    } catch (error: any) {
      console.error('❌ Error creating formidable instance:', error);
      reject(new Error(`Formidable initialization error: ${error.message}`));
    }
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

