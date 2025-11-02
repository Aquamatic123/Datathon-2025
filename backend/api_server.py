"""
Flask API Server
Receives documents from Next.js frontend and returns extracted text
"""

import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from document_processor import DocumentProcessor
from sagemaker_parser import SageMakerParser

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Initialize processor and SageMaker parser
document_processor = DocumentProcessor()
sagemaker_parser = SageMakerParser()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Law Document Analyzer'
    })


@app.route('/api/analyze-document', methods=['POST'])
def analyze_document():
    """
    Endpoint to extract text from an uploaded document and parse it with SageMaker LLM.
    Returns structured law data parsed from the directive.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        filename = data.get('filename', 'unknown')
        content = data.get('content', '')
        content_type = data.get('contentType', 'text/html')
        uploaded_at = data.get('uploadedAt')
        
        if not content:
            return jsonify({'success': False, 'error': 'No content provided'}), 400
        
        # Step 1: Extract text from the document
        print(f"Extracting text from {filename}...")
        result = document_processor.process_document(content.encode('utf-8'), content_type, filename)
        extracted_text = result['text']
        
        if not extracted_text or not extracted_text.strip():
            return jsonify({
                'success': False,
                'error': 'Failed to extract text from document'
            }), 400
        
        print(f"Extracted {len(extracted_text)} characters ({result['word_count']} words)")
        
        # Step 2: Parse the directive using SageMaker LLM
        print(f"📊 Parsing directive with SageMaker LLM...")
        print(f"   Text length: {len(extracted_text)} chars")
        print(f"   Content type: {content_type}")
        
        law_data = sagemaker_parser.parse_directive(extracted_text, filename)
        
        # Check if fallback was used
        if law_data.get('status') == 'Pending Review':
            print(f"⚠️  FALLBACK USED - SageMaker failed, basic parsing applied")
        else:
            print(f"✅ SageMaker SUCCESS - AI analysis complete")
        
        print(f"📋 Parsed law: {law_data.get('lawId')} (Status: {law_data.get('status')})")
        
        # Step 3: Attach the document to the law data
        law_data['document'] = {
            'filename': filename,
            'content': content,
            'contentType': content_type,
            'uploadedAt': uploaded_at
        }
        
        # Return the complete law data
        result = {
            'success': True,
            'lawData': law_data,
            'extractedText': extracted_text[:1000] + '...' if len(extracted_text) > 1000 else extracted_text,  # Include preview
            'metadata': {
                'filename': filename,
                'contentType': content_type,
                'wordCount': len(extracted_text.split()),
                'characterCount': len(extracted_text)
            }
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error in analyze_document: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True') == 'True'
    
    print("\n" + "="*60)
    print("🚀 Document Text Extraction API")
    print("="*60)
    print(f"Port: {port}")
    print(f"Debug mode: {debug}")
    print(f"Endpoint: http://localhost:{port}/api/analyze-document")
    print("="*60 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
