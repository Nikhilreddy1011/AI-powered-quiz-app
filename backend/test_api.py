#!/usr/bin/env python3
"""
Test script for the question generation API
"""

import requests
import json

def test_generate_questions():
    """Test the /api/generate-questions endpoint"""
    
    url = "http://localhost:8000/api/generate-questions"
    
    # Test payload
    payload = {
        "topic": "Python programming",
        "number_questions": 3
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("Testing question generation API...")
        print(f"URL: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        print("-" * 50)
        
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Generated questions:")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running on http://localhost:8000")
    except requests.exceptions.Timeout:
        print("❌ Timeout Error: The request took too long to complete")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_generate_questions()