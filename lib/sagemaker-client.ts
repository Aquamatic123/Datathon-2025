import { SageMakerRuntimeClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime';

/**
 * Get environment variables at runtime (not at module load time)
 * This is crucial for AWS Amplify compatibility
 */
function getEnvVars() {
  return {
    SAGEMAKER_ENDPOINT_NAME: process.env.SAGEMAKER_ENDPOINT_NAME,
    APP_REGION: process.env.APP_REGION || 'us-west-2',
    APP_ACCESS_KEY_ID: process.env.APP_ACCESS_KEY_ID,
    APP_SECRET_ACCESS_KEY: process.env.APP_SECRET_ACCESS_KEY,
  };
}

/**
 * Create SageMaker Runtime client
 * On AWS Lambda/Amplify: Uses Lambda execution role credentials automatically
 * On localhost: Uses explicit credentials from env vars
 */
function createSageMakerClient() {
  const env = getEnvVars();
  
  // On AWS Lambda, let the SDK use the execution role credentials automatically
  // On localhost, use explicit credentials if provided
  const clientConfig: any = {
    region: env.APP_REGION,
  };
  
  // Only set explicit credentials if both are provided (for localhost)
  if (env.APP_ACCESS_KEY_ID && env.APP_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: env.APP_ACCESS_KEY_ID,
      secretAccessKey: env.APP_SECRET_ACCESS_KEY,
    };
  }
  // Otherwise, SDK will use Lambda execution role or default credential chain
  
  return new SageMakerRuntimeClient(clientConfig);
}

/**
 * Extract law information from text using SageMaker AI model
 * Uses multi-step approach for better accuracy
 */
export async function extractLawInfoFromText(documentText: string): Promise<any> {
  const env = getEnvVars();
  
  console.log('🤖 Starting AI extraction with multi-call approach...');
  console.log(`  - Document length: ${documentText.length} chars`);
  console.log(`  - Endpoint: ${env.SAGEMAKER_ENDPOINT_NAME || 'NOT SET'}`);
  console.log(`  - Region: ${env.APP_REGION}`);
  console.log(`  - Strategy: 4 separate API calls for maximum accuracy\n`);
  
  if (!env.SAGEMAKER_ENDPOINT_NAME) {
    console.error('❌ No SageMaker endpoint configured!');
    throw new Error('SAGEMAKER_ENDPOINT_NAME is required for AI extraction');
  }

  const client = createSageMakerClient();
  
  // Make 4 focused API calls
  const results = await Promise.allSettled([
    extractJurisdictionAndStatus(client, documentText),
    extractDateAndTitle(client, documentText),
    extractSectorAndImpact(client, documentText),
    extractSummary(client, documentText),
  ]);
  
  console.log('\n📊 API Call Results:');
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`  ✅ Call ${i + 1}: Success`);
    } else {
      console.log(`  ❌ Call ${i + 1}: Failed - ${result.reason.message}`);
    }
  });
  
  // Combine all successful results
  const lawData: any = {
    lawId: '', // Will be generated at the end
  };
  
  // Extract data from each call
  if (results[0].status === 'fulfilled') {
    Object.assign(lawData, results[0].value);
  }
  if (results[1].status === 'fulfilled') {
    Object.assign(lawData, results[1].value);
  }
  if (results[2].status === 'fulfilled') {
    Object.assign(lawData, results[2].value);
  }
  if (results[3].status === 'fulfilled') {
    Object.assign(lawData, results[3].value);
  }
  
  // Validate we got real data (not all defaults)
  const hasRealData = validateExtractedData(lawData);
  
  if (!hasRealData) {
    console.error('\n⚠️ AI extraction returned mostly default values');
    console.error('   Extracted data so far:', JSON.stringify(lawData, null, 2));
    console.error('   Will use text-based extraction as backup...');
    
    // Try to extract from raw text as last resort
    const textBasedData = extractFromRawText(documentText);
    Object.assign(lawData, textBasedData);
    
    // Re-validate
    const hasRealDataNow = validateExtractedData(lawData);
    if (!hasRealDataNow) {
      console.error('\n❌ Even text extraction failed!');
      console.error('   Using smart defaults based on document content...');
    }
  }
  
  // Fill in any missing fields with smart defaults
  lawData.jurisdiction = lawData.jurisdiction || 'Unknown';
  lawData.status = lawData.status || 'Pending';
  lawData.published = lawData.published || new Date().toISOString().split('T')[0];
  lawData.title = lawData.title || extractTitleFromText(documentText);
  lawData.sector = lawData.sector || 'General';
  lawData.impact = typeof lawData.impact === 'number' ? lawData.impact : 5;
  lawData.confidence = lawData.confidence || 'Medium';
  lawData.summary = lawData.summary || documentText.substring(0, 300);
  
  // Generate smart law ID
  lawData.lawId = generateLawId(lawData);
  
  console.log('\n✅ Final extracted data:');
  console.log(JSON.stringify(lawData, null, 2));
  
  return lawData;
}

/**
 * Call 1: Extract jurisdiction and status (most critical)
 */
async function extractJurisdictionAndStatus(client: any, documentText: string): Promise<any> {
  const contextText = documentText.substring(0, 12000);
  
  const prompt = `Read this legal document and answer TWO questions:

DOCUMENT:
${contextText}

QUESTION 1: What is the jurisdiction (geographic region) for this law?
Look for: country names, state names, "United States", "EU", "European Union", "California", etc.
Answer with the specific jurisdiction name.

QUESTION 2: What is the current status of this law?
Look for: "enacted", "effective", "in force", "active", "proposed", "pending", "expired"
Choose ONLY from: Active, Pending, or Expired

Format your answer as JSON:
{"jurisdiction": "answer to question 1", "status": "answer to question 2"}

JSON:`;

  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 150,
      temperature: 0.1,
      top_p: 0.9,
      do_sample: false
    }
  };

  console.log('📞 Call 1: Jurisdiction & Status...');
  const response = await invokeSageMaker(client, payload);
  const result = parseJSONFromResponse(response);
  console.log('   Result:', result);
  return result;
}

/**
 * Call 2: Extract date and title
 */
async function extractDateAndTitle(client: any, documentText: string): Promise<any> {
  const contextText = documentText.substring(0, 12000);
  
  const prompt = `Read this legal document and answer TWO questions:

DOCUMENT:
${contextText}

QUESTION 1: What is the publication or effective date?
Look for: dates, "published", "effective date", "enacted", year mentions
Answer in YYYY-MM-DD format (e.g., 2024-03-20)

QUESTION 2: What is the title or name of this law?
Look for: titles, headings, "Act", law names
Answer with the full official title

Format your answer as JSON:
{"published": "YYYY-MM-DD", "title": "full title here"}

JSON:`;

  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 200,
      temperature: 0.1,
      top_p: 0.9,
      do_sample: false
    }
  };

  console.log('📞 Call 2: Date & Title...');
  const response = await invokeSageMaker(client, payload);
  const result = parseJSONFromResponse(response);
  console.log('   Result:', result);
  return result;
}

/**
 * Call 3: Extract sector and impact score
 */
async function extractSectorAndImpact(client: any, documentText: string): Promise<any> {
  const contextText = documentText.substring(0, 15000);
  
  const prompt = `Analyze this legal document for market impact:

DOCUMENT:
${contextText}

QUESTION 1: Which sector is primarily affected?
Choose ONE from: Technology, Healthcare, Finance, Energy, Clean Energy, Transportation, Agriculture, Manufacturing, Retail, General
Look for: industry mentions, company types, affected businesses

QUESTION 2: What is the market impact score from 0-10?
0 = minimal impact, 5 = moderate, 10 = major market disruption
Consider: how many companies affected, compliance costs, penalties

QUESTION 3: How confident are you?
Choose ONE from: High, Medium, Low

Format your answer as JSON:
{"sector": "sector name", "impact": number, "confidence": "High/Medium/Low"}

JSON:`;

  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 150,
      temperature: 0.3,
      top_p: 0.9,
      do_sample: true
    }
  };

  console.log('📞 Call 3: Sector & Impact...');
  const response = await invokeSageMaker(client, payload);
  const result = parseJSONFromResponse(response);
  console.log('   Result:', result);
  return result;
}

/**
 * Call 4: Extract summary
 */
async function extractSummary(client: any, documentText: string): Promise<any> {
  const contextText = documentText.substring(0, 15000);
  
  const prompt = `Summarize this legal document in 2-3 sentences:

DOCUMENT:
${contextText}

Write a brief summary that explains:
1. What the law does
2. Who it affects
3. Why it matters

Keep it under 300 characters. Format as JSON:
{"summary": "your summary here"}

JSON:`;

  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 400,
      temperature: 0.4,
      top_p: 0.9,
      do_sample: true
    }
  };

  console.log('📞 Call 4: Summary...');
  const response = await invokeSageMaker(client, payload);
  const result = parseJSONFromResponse(response);
  console.log('   Result:', result);
  return result;
}

/**
 * Parse JSON from AI response - flexible parsing with multiple strategies
 */
function parseJSONFromResponse(responseBody: any): any {
  let textResponse = '';
  
  console.log('   🔍 Parsing AI response...');
  console.log('   Response type:', typeof responseBody);
  console.log('   Full response:', JSON.stringify(responseBody).substring(0, 300));
  
  // Extract text from different response formats
  if (Array.isArray(responseBody)) {
    textResponse = responseBody[0]?.generated_text || JSON.stringify(responseBody[0]) || '';
  } else if (responseBody.generated_text) {
    textResponse = responseBody.generated_text;
  } else if (responseBody.output) {
    textResponse = responseBody.output;
  } else if (responseBody.outputs) {
    textResponse = Array.isArray(responseBody.outputs) ? responseBody.outputs[0] : responseBody.outputs;
  } else if (typeof responseBody === 'string') {
    textResponse = responseBody;
  } else {
    textResponse = JSON.stringify(responseBody);
  }

  console.log(`   Extracted text: ${textResponse.substring(0, 300)}...`);

  // Clean up the response
  textResponse = textResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/^[^{]*/, '') // Remove text before first {
    .trim();
  
  // Strategy 1: Try to find and parse JSON object
  const jsonMatch = textResponse.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('   ✅ Parsed JSON successfully:', parsed);
      return parsed;
    } catch (e) {
      console.warn(`   ⚠️ JSON parse error: ${e}`);
    }
  }
  
  // Strategy 2: Try to extract key-value pairs manually
  console.log('   Trying manual extraction...');
  const extracted: any = {};
  
  // Look for common patterns
  const patterns = [
    /jurisdiction["\s:]+([^",}\n]+)/i,
    /status["\s:]+([^",}\n]+)/i,
    /published["\s:]+([^",}\n]+)/i,
    /title["\s:]+([^",}\n]+)/i,
    /sector["\s:]+([^",}\n]+)/i,
    /impact["\s:]+(\d+)/i,
    /confidence["\s:]+([^",}\n]+)/i,
    /summary["\s:]+([^"]+)/i,
  ];
  
  patterns.forEach(pattern => {
    const match = textResponse.match(pattern);
    if (match && match[1]) {
      const key = pattern.source.split('[')[0];
      extracted[key] = match[1].trim().replace(/["']/g, '');
    }
  });
  
  if (Object.keys(extracted).length > 0) {
    console.log('   ✅ Manually extracted:', extracted);
    return extracted;
  }
  
  console.warn('   ❌ Could not parse any data from response');
  return {};
}

/**
 * Validate that we got real data from AI (not all defaults)
 */
function validateExtractedData(lawData: any): boolean {
  // Check if we have at least 3 fields with real values
  let realFields = 0;
  
  if (lawData.jurisdiction && lawData.jurisdiction !== 'Unknown') realFields++;
  if (lawData.status && lawData.status !== 'Pending') realFields++;
  if (lawData.title && lawData.title !== 'Untitled Law' && lawData.title.length > 5) realFields++;
  if (lawData.sector && lawData.sector !== 'General') realFields++;
  if (lawData.impact && lawData.impact !== 5) realFields++;
  if (lawData.summary && lawData.summary.length > 50) realFields++;
  
  console.log(`\n🔍 Validation: ${realFields}/6 fields have real data`);
  
  return realFields >= 3;
}

/**
 * Extract title from document text as fallback
 */
function extractTitleFromText(documentText: string): string {
  // Look for title patterns in first 500 characters
  const beginning = documentText.substring(0, 500);
  
  // Common patterns
  const patterns = [
    /(?:title|act|law|regulation):\s*(.+)/i,
    /^([A-Z][A-Za-z\s]+Act\s+(?:of\s+)?\d{4})/m,
    /^([A-Z][A-Za-z\s]+Act)/m,
    /^([A-Z][A-Za-z\s]+Law)/m,
    /^([A-Z][A-Za-z\s]+Regulation)/m,
  ];
  
  for (const pattern of patterns) {
    const match = beginning.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 100);
    }
  }
  
  // Fallback: use first line
  const firstLine = beginning.split('\n')[0].trim();
  return firstLine.substring(0, 80) || 'Untitled Law';
}

/**
 * Extract data from raw document text as last resort
 */
function extractFromRawText(documentText: string): any {
  console.log('   📝 Attempting text-based extraction...');
  const text = documentText.toLowerCase();
  const extracted: any = {};
  
  // Extract jurisdiction
  if (text.includes('united states') || text.includes('u.s.') || text.includes('usa')) {
    extracted.jurisdiction = 'United States';
  } else if (text.includes('european union') || text.includes('eu ')) {
    extracted.jurisdiction = 'European Union';
  } else if (text.includes('california')) {
    extracted.jurisdiction = 'California';
  } else if (text.includes('new york')) {
    extracted.jurisdiction = 'New York';
  }
  
  // Extract status
  if (text.includes('active') || text.includes('enacted') || text.includes('effective')) {
    extracted.status = 'Active';
  } else if (text.includes('expired') || text.includes('repealed')) {
    extracted.status = 'Expired';
  }
  
  // Extract sector
  if (text.includes('technology') || text.includes('tech ') || text.includes('digital') || text.includes('data')) {
    extracted.sector = 'Technology';
  } else if (text.includes('healthcare') || text.includes('health') || text.includes('medical')) {
    extracted.sector = 'Healthcare';
  } else if (text.includes('finance') || text.includes('financial') || text.includes('bank')) {
    extracted.sector = 'Finance';
  } else if (text.includes('energy') || text.includes('power')) {
    extracted.sector = 'Energy';
  }
  
  // Extract date
  const dateMatch = documentText.match(/\d{4}-\d{2}-\d{2}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i);
  if (dateMatch) {
    extracted.published = dateMatch[0];
  }
  
  // Extract title
  extracted.title = extractTitleFromText(documentText);
  
  console.log('   Text-based extraction result:', extracted);
  return extracted;
}

/**
 * Invoke SageMaker endpoint with error handling
 */
async function invokeSageMaker(client: any, payload: any): Promise<any> {
  const env = getEnvVars();
  
  if (!env.SAGEMAKER_ENDPOINT_NAME) {
    throw new Error('SAGEMAKER_ENDPOINT_NAME environment variable is not set');
  }
  
  const command = new InvokeEndpointCommand({
    EndpointName: env.SAGEMAKER_ENDPOINT_NAME,
    ContentType: 'application/json',
    Body: JSON.stringify(payload),
  });

  console.log(`  - Sending ${payload.inputs.length} chars to model...`);
  
  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.Body));
  
  console.log('  ✓ Received response');
  
  return responseBody;
}

/**
 * Generate a unique law ID based on extracted metadata
 */
function generateLawId(metadata: any): string {
  const year = metadata.published ? metadata.published.substring(0, 4) : new Date().getFullYear();
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Try to create meaningful ID from title
  if (metadata.title && metadata.title !== 'Untitled Law') {
    const titleWords = metadata.title
      .split(/\s+/)
      .filter((w: string) => w.length > 3)
      .slice(0, 2)
      .map((w: string) => w.substring(0, 4).toUpperCase())
      .join('_');
    
    if (titleWords) {
      return `Law_${year}_${titleWords}_${randomId.substring(0, 3)}`;
    }
  }
  
  return `Law_${year}_${randomId}`;
}


