#!/usr/bin/env python3
"""
Quick test script to verify AWS SageMaker connection
Run this before starting the full backend to ensure credentials work
"""

import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_sagemaker_connection():
    """Test connection to SageMaker endpoint"""
    
    endpoint_name = os.getenv('SAGEMAKER_ENDPOINT_NAME', 'endpoint-quick-start-85saw')
    region = os.getenv('AWS_REGION', 'us-west-2')
    
    print("="*60)
    print("🧪 Testing AWS SageMaker Connection")
    print("="*60)
    print(f"Endpoint: {endpoint_name}")
    print(f"Region: {region}")
    print()
    
    try:
        # Test AWS credentials
        print("1. Testing AWS credentials...")
        sts = boto3.client('sts', region_name=region)
        identity = sts.get_caller_identity()
        print(f"✅ Connected as: {identity['Arn']}")
        print(f"   Account ID: {identity['Account']}")
        print()
        
        # Test SageMaker endpoint
        print("2. Checking SageMaker endpoint status...")
        sagemaker = boto3.client('sagemaker', region_name=region)
        endpoint_info = sagemaker.describe_endpoint(EndpointName=endpoint_name)
        status = endpoint_info['EndpointStatus']
        print(f"✅ Endpoint Status: {status}")
        
        if status != 'InService':
            print(f"⚠️  Warning: Endpoint is not 'InService', it's '{status}'")
            print("   Inference may fail until endpoint is fully deployed.")
            return False
        
        print()
        
        # Test inference with a simple prompt
        print("3. Testing inference with sample prompt...")
        sagemaker_runtime = boto3.client('sagemaker-runtime', region_name=region)
        
        test_payload = {
            "inputs": "What is the capital of France? Answer in one word.",
            "parameters": {
                "max_new_tokens": 50,
                "temperature": 0.1
            }
        }
        
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType='application/json',
            Body=json.dumps(test_payload)
        )
        
        response_body = json.loads(response['Body'].read().decode())
        print(f"✅ Inference successful!")
        print(f"   Response: {response_body}")
        print()
        
        print("="*60)
        print("✅ All tests passed! SageMaker is ready to use.")
        print("="*60)
        return True
        
    except Exception as e:
        print()
        print("="*60)
        print(f"❌ Error: {str(e)}")
        print("="*60)
        print()
        print("Troubleshooting tips:")
        print("1. Check your AWS credentials with: aws sts get-caller-identity")
        print("2. Verify endpoint name in .env file")
        print("3. Ensure endpoint is in 'InService' status in AWS console")
        print("4. Check IAM permissions for SageMaker access")
        print()
        return False

if __name__ == '__main__':
    success = test_sagemaker_connection()
    exit(0 if success else 1)
