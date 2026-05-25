from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

app = FastAPI()

# 1. Configure CORS so your Vite frontend can talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your Vite local server URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Create the upload endpoint
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # For today, we just save the file to a temporary folder to prove the upload works
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)
    
    file_path = f"{temp_dir}/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {
        "status": "success", 
        "filename": file.filename, 
        "message": "Audio file securely received by backend!"
    }