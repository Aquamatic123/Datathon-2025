import boto3
import json
import os
from typing import Dict, Any, Optional

class SageMakerParser:
    """
    Parser that uses AWS SageMaker endpoint to analyze legal directives
    and extract structured law data.
    """
    
    def __init__(self, endpoint_name: Optional[str] = None, region: str = 'us-west-2'):
        """
        Initialize the SageMaker parser.
        
        Args:
            endpoint_name: SageMaker endpoint name (from env or parameter)
            region: AWS region where endpoint is deployed
        """
        self.endpoint_name = endpoint_name or os.getenv('SAGEMAKER_ENDPOINT_NAME', 'endpoint-quick-start-85saw')
        self.region = region
        
        self.sagemaker_runtime = boto3.client(
            service_name='sagemaker-runtime',
            region_name=self.region
        )
    
    def parse_directive(self, extracted_text: str, filename: str) -> Dict[str, Any]:
        """
        Parse a legal directive using the SageMaker LLM endpoint.
        
        Args:
            extracted_text: Clean text extracted from the directive document
            filename: Original filename for context
            
        Returns:
            Dictionary containing parsed law data with fields:
            - lawId, title, jurisdiction, sector, impactScore, 
              complianceCost, affectedStocks, summary, etc.
        """
        
        # Drastically reduce text to avoid 424 errors
        # Try very small input first to isolate the issue
        max_text_length = 3000  # Reduced from 15000 to 3000
        truncated_text = extracted_text[:max_text_length]
        if len(extracted_text) > max_text_length:
            print(f"⚠️  Text truncated from {len(extracted_text)} to {max_text_length} characters")
            truncated_text += "\n\n[...text truncated...]"
        
        # Create a structured prompt for the LLM
        prompt = self._create_parsing_prompt(truncated_text, filename)
        
        # Prepare the payload for SageMaker endpoint
        # Minimal parameters to avoid 424 errors
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 512,    # Further reduced to 512
                "temperature": 0.7,
                "do_sample": True
            }
        }
        
        try:
            print(f"📤 Sending request to SageMaker (prompt length: {len(prompt)} chars)...")
            
            # Invoke the SageMaker endpoint
            response = self.sagemaker_runtime.invoke_endpoint(
                EndpointName=self.endpoint_name,
                ContentType='application/json',
                Body=json.dumps(payload)
            )
            
            print(f"📥 Received response from SageMaker")
            
            # Parse the response
            response_body = json.loads(response['Body'].read().decode())
            print(f"🔍 Raw SageMaker response type: {type(response_body)}")
            print(f"🔍 Raw response: {str(response_body)[:500]}...")
            
            # Extract the generated text from the response
            # The structure might vary - adjust based on your endpoint's response format
            if isinstance(response_body, list) and len(response_body) > 0:
                generated_text = response_body[0].get('generated_text', '')
            elif isinstance(response_body, dict):
                generated_text = response_body.get('generated_text', str(response_body))
            else:
                generated_text = str(response_body)
            
            print(f"📝 Extracted text from response: {generated_text[:300]}...")
            
            # Parse the LLM's structured output into law data
            law_data = self._parse_llm_response(generated_text, filename)
            
            print(f"✅ Parsed law data successfully")
            return law_data
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error calling SageMaker endpoint: {error_msg}")
            
            # No fallback - just fail and let the user know
            raise Exception(f"SageMaker parsing failed: {error_msg}")
    
    def _create_parsing_prompt(self, extracted_text: str, filename: str) -> str:
        """
        Create a structured prompt for the LLM to parse the directive.
        Ultra-simplified to avoid 424 model errors.
        """
        # Minimal prompt to test SageMaker connectivity
        prompt = f"""Analyze this legal document and return JSON with: lawId, title, jurisdiction, sector, impactScore (1-10), summary.

Text: {extracted_text[:800]}

Return JSON:"""
        
        return prompt
    
    def _parse_llm_response(self, llm_output: str, filename: str) -> Dict[str, Any]:
        """
        Parse the LLM's response and extract structured law data.
        Handles cases where LLM might include extra text around the JSON.
        """
        try:
            # Try to find JSON in the response
            # Sometimes LLMs add explanatory text before/after the JSON
            start_idx = llm_output.find('{')
            end_idx = llm_output.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = llm_output[start_idx:end_idx + 1]
                law_data = json.loads(json_str)
            else:
                # If no JSON found, try parsing the whole thing
                law_data = json.loads(llm_output)
            
            # Validate and set defaults for required fields
            required_fields = {
                'lawId': f'LAW-{filename[:20]}',
                'title': 'Untitled Directive',
                'jurisdiction': 'EU',
                'sector': 'General',
                'impactScore': 5,
                'complianceCost': 'Medium',
                'affectedStocks': [],
                'summary': 'No summary available',
                'keyProvisions': [],
                'effectiveDate': None,
                'complianceDeadline': None
            }
            
            # Merge with defaults
            for key, default_value in required_fields.items():
                if key not in law_data or law_data[key] is None:
                    law_data[key] = default_value
            
            # Transform to database schema
            # The database expects specific field names and structure
            transformed_data = {
                # IMPORTANT: Include lawId for frontend
                'lawId': law_data.get('lawId', f'LAW-{filename[:20]}'),
                'title': law_data.get('title', 'Untitled Directive'),
                
                # Direct mappings
                'jurisdiction': law_data.get('jurisdiction', 'EU'),
                'status': law_data.get('status', 'Active'),
                'sector': law_data.get('sector', 'General'),
                'impact': law_data.get('impactScore', 5),
                'confidence': self._map_compliance_cost_to_confidence(law_data.get('complianceCost', 'Medium')),
                'published': law_data.get('effectiveDate') or law_data.get('dateEnacted') or '2024-01-01',
                'affected': 0,  # Will be set based on stocks
                
                # Transform affectedStocks array to stocks_impacted structure
                'stocks_impacted': {
                    'STOCK_IMPACTED': self._transform_stocks(
                        law_data.get('affectedStocks', []),
                        law_data.get('sector', 'General'),
                        law_data.get('impactScore', 5)
                    )
                }
            }
            
            # Set affected count
            transformed_data['affected'] = len(transformed_data['stocks_impacted']['STOCK_IMPACTED'])
            
            return transformed_data
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM response as JSON: {e}")
            print(f"LLM Output: {llm_output[:500]}...")
            
            # Return a fallback structure with the raw text
            return {
                'lawId': f'LAW-{filename[:20]}',
                'title': filename,
                'jurisdiction': 'EU',
                'sector': 'General',
                'impactScore': 5,
                'complianceCost': 'Medium',
                'affectedStocks': [],
                'summary': 'Failed to parse directive. Raw LLM output available in keyProvisions.',
                'keyProvisions': [llm_output[:1000]],  # Include truncated raw output
                'effectiveDate': None,
                'complianceDeadline': None,
                'dateEnacted': '2024-01-01',
                'status': 'Pending Analysis'
            }
    
    def _map_compliance_cost_to_confidence(self, compliance_cost: str) -> str:
        """Map compliance cost to confidence level"""
        mapping = {
            'Low': 'Low',
            'Medium': 'Medium',
            'High': 'High',
            'Very High': 'High'
        }
        return mapping.get(compliance_cost, 'Medium')
    
    def _transform_stocks(self, affected_stocks: list, sector: str, impact_score: int) -> list:
        """
        Transform array of ticker symbols to StockImpacted objects.
        
        Args:
            affected_stocks: List of ticker symbols (e.g., ['AAPL', 'GOOGL'])
            sector: Sector of the law
            impact_score: Overall impact score
            
        Returns:
            List of StockImpacted objects matching database schema
        """
        stocks = []
        
        # Known company names for common tickers
        company_names = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'AMZN': 'Amazon.com Inc.',
            'META': 'Meta Platforms Inc.',
            'TSLA': 'Tesla Inc.',
            'NVDA': 'NVIDIA Corporation',
            'JPM': 'JPMorgan Chase & Co.',
            'V': 'Visa Inc.',
            'WMT': 'Walmart Inc.',
            'JNJ': 'Johnson & Johnson',
            'PG': 'Procter & Gamble Co.',
            'MA': 'Mastercard Inc.',
            'HD': 'The Home Depot Inc.',
            'BAC': 'Bank of America Corp.',
            'XOM': 'Exxon Mobil Corporation',
            'CVX': 'Chevron Corporation',
            'PFE': 'Pfizer Inc.',
            'KO': 'The Coca-Cola Company',
            'PEP': 'PepsiCo Inc.'
        }
        
        for ticker in affected_stocks:
            if isinstance(ticker, str):
                stocks.append({
                    'ticker': ticker,
                    'company_name': company_names.get(ticker, f'{ticker} Corp.'),
                    'sector': sector,
                    'impact_score': impact_score,
                    'correlation_confidence': self._map_impact_to_confidence(impact_score),
                    'notes': 'Identified by AI analysis'
                })
        
        return stocks
    
    def _map_impact_to_confidence(self, impact_score: int) -> str:
        """Map impact score to correlation confidence"""
        if impact_score >= 8:
            return 'High'
        elif impact_score >= 5:
            return 'Medium'
        else:
            return 'Low'
    
    def _create_fallback_law_data(self, extracted_text: str, filename: str) -> Dict[str, Any]:
        """
        Create a basic law data structure when SageMaker fails.
        Extracts what it can from the text and filename.
        """
        print("🔄 Creating fallback law data from text analysis...")
        
        # Try to extract title from first lines
        lines = extracted_text.split('\n')
        title = filename.replace('.html', '').replace('.xml', '').replace('.htm', '')
        for line in lines[:10]:
            if line.strip() and len(line) > 20:
                title = line.strip()[:100]
                break
        
        # Try to identify jurisdiction
        jurisdiction = 'EU'
        if 'european union' in extracted_text.lower() or 'eu' in extracted_text.lower()[:1000]:
            jurisdiction = 'EU'
        elif 'united states' in extracted_text.lower() or 'u.s.' in extracted_text.lower()[:1000]:
            jurisdiction = 'US'
        
        # Try to identify sector based on keywords
        text_lower = extracted_text.lower()[:5000]
        sector = 'General'
        sector_keywords = {
            'Technology': ['digital', 'software', 'technology', 'platform', 'data', 'cyber'],
            'Finance': ['bank', 'financial', 'credit', 'investment', 'securities'],
            'Healthcare': ['health', 'medical', 'patient', 'pharmaceutical', 'drug'],
            'Energy': ['energy', 'power', 'electric', 'renewable', 'solar', 'wind'],
            'Manufacturing': ['manufacturing', 'industrial', 'production', 'factory']
        }
        
        for sector_name, keywords in sector_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                sector = sector_name
                break
        
        return {
            'lawId': f'LAW-{filename[:30]}'.replace('.', '-'),
            'title': title,
            'jurisdiction': jurisdiction,
            'status': 'Pending Review',  # Mark as needing review
            'sector': sector,
            'impact': 5,  # Neutral impact
            'confidence': 'Low',  # Low confidence since it's fallback
            'published': '2024-01-01',
            'affected': 0,
            'stocks_impacted': {
                'STOCK_IMPACTED': []  # No stocks identified
            }
        }
