import requests
import json

url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

payload = json.dumps({
  "contents": [
    {
      "parts": [
        {
          "text": "Explain how AI works in a few words"
        }
      ]
    }
  ]
})
headers = {
  'X-goog-api-key': 'AIzaSyDbgoBre0lgxaSfNyPQPJrhChnKr2EA6_0',
  'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)
