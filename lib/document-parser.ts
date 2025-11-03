import * as cheerio from 'cheerio';
import * as pdfParse from 'pdf-parse';

/**
 * Parse different document formats to extract text
 */

export async function parseDocument(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();
  
  console.log(`📄 Parsing document: ${filename} (type: ${ext})`);

  try {
    switch (ext) {
      case 'txt':
      case 'text':
        return parseTextFile(buffer);
      
      case 'html':
      case 'htm':
        return parseHtmlFile(buffer);
      
      case 'xml':
        return parseXmlFile(buffer);
      
      case 'pdf':
        return await parsePdfFile(buffer);
      
      default:
        // Try to parse as text
        return parseTextFile(buffer);
    }
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    throw new Error(`Failed to parse ${ext} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Parse plain text file
function parseTextFile(buffer: Buffer): string {
  const text = buffer.toString('utf-8');
  console.log(`✓ Parsed text file, length: ${text.length} chars`);
  return text.trim();
}

// Parse HTML file using cheerio
function parseHtmlFile(buffer: Buffer): string {
  const html = buffer.toString('utf-8');
  const $ = cheerio.load(html);
  
  // Remove script and style tags
  $('script, style').remove();
  
  // Extract text content
  const text = $('body').text() || $.text();
  
  // Clean up whitespace
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
  
  console.log(`✓ Parsed HTML file, extracted ${cleaned.length} chars`);
  return cleaned;
}

// Parse XML file using cheerio
function parseXmlFile(buffer: Buffer): string {
  const xml = buffer.toString('utf-8');
  const $ = cheerio.load(xml, { xmlMode: true });
  
  // Extract all text content
  const text = $.text();
  
  // Clean up whitespace
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
  
  console.log(`✓ Parsed XML file, extracted ${cleaned.length} chars`);
  return cleaned;
}

// Parse PDF file using pdf-parse
async function parsePdfFile(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse uses native binaries that may not work on Lambda
    // Try to use it, but have a fallback
    const pdf = (pdfParse as any).default || pdfParse;
    const data = await pdf(buffer);
    const text = data.text.trim();
    
    console.log(`✓ Parsed PDF file, ${data.numpages} pages, ${text.length} chars`);
    return text;
  } catch (error) {
    console.warn('⚠️ PDF parsing failed, likely due to Lambda environment. Returning error message.');
    console.warn('Error:', error);
    // On Lambda, pdf-parse might not work due to missing native dependencies
    throw new Error('PDF parsing is not supported on AWS Lambda. Please upload TXT, HTML, or XML files instead.');
  }
}

/**
 * Truncate text to fit within AI model limits
 */
export function truncateText(text: string, maxChars: number = 15000): string {
  if (text.length <= maxChars) {
    return text;
  }
  
  console.log(`⚠️ Text truncated from ${text.length} to ${maxChars} chars`);
  return text.substring(0, maxChars) + '\n\n[... text truncated due to length ...]';
}

