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
        
        # Create a structured prompt for the LLM
        prompt = self._create_parsing_prompt(extracted_text, filename)
        
        # Prepare the payload for SageMaker endpoint
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 2048,  # Increased for detailed analysis
                "temperature": 0.3,       # Lower temp for more consistent structured output
                "top_p": 0.9
            }
        }
        
        try:
            # Invoke the SageMaker endpoint
            response = self.sagemaker_runtime.invoke_endpoint(
                EndpointName=self.endpoint_name,
                ContentType='application/json',
                Body=json.dumps(payload)
            )
            
            # Parse the response
            response_body = json.loads(response['Body'].read().decode())
            
            # Extract the generated text from the response
            # The structure might vary - adjust based on your endpoint's response format
            if isinstance(response_body, list) and len(response_body) > 0:
                generated_text = response_body[0].get('generated_text', '')
            elif isinstance(response_body, dict):
                generated_text = response_body.get('generated_text', str(response_body))
            else:
                generated_text = str(response_body)
            
            # Parse the LLM's structured output into law data
            law_data = self._parse_llm_response(generated_text, filename)
            
            return law_data
            
        except Exception as e:
            print(f"Error calling SageMaker endpoint: {e}")
            raise Exception(f"SageMaker parsing failed: {str(e)}")
    
    def _create_parsing_prompt(self, extracted_text: str, filename: str) -> str:
        """
        Create a structured prompt for the LLM to parse the directive.
        """
        prompt = f"""You are an expert legal analyst specializing in EU regulations and directives. 
Analyze the following legal directive and extract structured information.

DIRECTIVE DOCUMENT:
Filename: {filename}

TEXT:
{extracted_text}

TASK:
Extract and provide the following information in a structured JSON format:

1. **lawId**: A unique identifier (e.g., "EU-2024-1234" or extract from document)
2. **title**: Full title of the directive/regulation
3. **jurisdiction**: The jurisdiction (e.g., "EU", "US-Federal", country code)
4. **sector**: Primary affected sector (e.g., "Technology", "Finance", "Healthcare", "Energy", "Manufacturing")
5. **impactScore**: A score from 1-10 indicating regulatory impact severity
6. **complianceCost**: Estimated compliance cost category ("Low", "Medium", "High", "Very High")
7. **affectedStocks**: Array of stock ticker symbols that would be affected (e.g., ["AAPL", "GOOGL", "MSFT"])
8. **summary**: A concise 2-3 sentence summary of the directive
9. **keyProvisions**: Array of key provisions or requirements (3-5 main points)
10. **effectiveDate**: When the directive takes effect (YYYY-MM-DD format if available)
11. **complianceDeadline**: Compliance deadline (YYYY-MM-DD format if available)

OUTPUT FORMAT:
Provide your response as a valid JSON object. Do not include any other text, just the JSON.

Example format:
{{
  "lawId": "EU-2024-1234",
  "title": "Digital Markets Act Implementation Directive",
  "jurisdiction": "EU",
  "sector": "Technology",
  "impactScore": 8,
  "complianceCost": "High",
  "affectedStocks": ["AAPL", "GOOGL", "META", "AMZN"],
  "summary": "This directive implements the Digital Markets Act requirements for large tech platforms. It establishes new obligations for gatekeepers and creates enforcement mechanisms.",
  "keyProvisions": [
    "Platform interoperability requirements",
    "Data portability obligations",
    "Prohibition of self-preferencing",
    "Enhanced transparency reporting"
  ],
  "effectiveDate": "2024-05-01",
  "complianceDeadline": "2025-03-01"
}}

Now analyze the provided directive and return the JSON:"""
        
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
            
            # Add metadata
            law_data['dateEnacted'] = law_data.get('effectiveDate') or '2024-01-01'
            law_data['status'] = 'Active'
            
            return law_data
            
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
