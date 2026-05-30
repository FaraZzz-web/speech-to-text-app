from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Import our new database files
import models
from database import engine, SessionLocal

load_dotenv()
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

# This tells SQLAlchemy to create the tables in Supabase if they don't exist yet!
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get the DB session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not DEEPGRAM_API_KEY:
        raise HTTPException(status_code=500, detail="Deepgram API key is missing.")

    try:
        audio_data = await file.read()
        url = "https://api.deepgram.com/v1/listen"
        
        headers = {
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": file.content_type or "audio/webm",
        }
        
        params = {
            "model": "nova-2",
            "smart_format": "true" 
        }

        response = requests.post(url, headers=headers, params=params, data=audio_data)

        if response.status_code == 200:
            result = response.json()
            transcript_text = result["results"]["channels"][0]["alternatives"][0]["transcript"]
            
            # --- NEW (Day 5): Save to Database ---
            if transcript_text:
                new_transcript = models.Transcript(text=transcript_text)
                db.add(new_transcript)
                db.commit()
                db.refresh(new_transcript)
            
            return {"status": "success", "transcript": transcript_text}
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to transcribe.")
            
    except Exception as e:
        print("Server Error:", e)
        raise HTTPException(status_code=500, detail="Internal server error.")
    
# --- NEW (Day 6): Fetch History Endpoint ---
@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    try:
        # Query the database for all transcripts, ordered by newest first
        transcripts = db.query(models.Transcript).order_by(models.Transcript.created_at.desc()).all()
        return {"status": "success", "data": transcripts}
    except Exception as e:
        print("Database Error:", e)
        raise HTTPException(status_code=500, detail="Could not fetch history from the database.")
    