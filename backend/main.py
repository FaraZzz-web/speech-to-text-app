from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

# Load the secret key from your .env file
load_dotenv()
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # 1. Safety check: Ensure the API key loaded correctly
    if not DEEPGRAM_API_KEY:
        raise HTTPException(status_code=500, detail="Deepgram API key is missing. Check your .env file.")

    try:
        # 2. Read the audio file directly into memory
        audio_data = await file.read()

        # 3. Prepare the Deepgram API request
        url = "https://api.deepgram.com/v1/listen"
        
        headers = {
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": file.content_type or "audio/webm",
        }
        
        # We use 'nova-2' as it is their fastest, most accurate model
        params = {
            "model": "nova-2",
            "smart_format": "true" 
        }

        # 4. Send the audio to Deepgram
        response = requests.post(url, headers=headers, params=params, data=audio_data)

        # 5. Parse the result and send the transcript back to React
        if response.status_code == 200:
            result = response.json()
            # Navigate through Deepgram's JSON response to find the actual text string
            transcript = result["results"]["channels"][0]["alternatives"][0]["transcript"]
            
            return {"status": "success", "transcript": transcript}
        else:
            print("Deepgram Error:", response.text)
            raise HTTPException(status_code=response.status_code, detail="Failed to transcribe audio.")
            
    except Exception as e:
        print("Server Error:", e)
        raise HTTPException(status_code=500, detail="Internal server error during transcription.")