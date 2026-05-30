# 🎙️ Speech-to-Text Transcriber (Full Stack)

A real-time, full-stack web application that captures user speech via the microphone, processes it using AI, and saves the transcription history to a cloud database.

## 🚀 Tech Stack

- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** PostgreSQL (Supabase)
- **AI Provider:** Deepgram (Nova-2 Model)

## ✨ Features

- **Real-time Audio Capture:** Uses the native browser `MediaRecorder` API.
- **Fast Transcription:** Integrates Deepgram's Nova-2 model for sub-second STT conversion.
- **Database Persistence:** Automatically saves all transcripts to a PostgreSQL cloud database.
- **History Dashboard:** Fetches and displays past recordings seamlessly.
- **Clipboard Utility:** One-click copying of generated text.

## 🛠️ Local Setup Instructions

### 1. Backend (FastAPI)

Navigate to the backend directory and set up the Python environment:

```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # (On Windows Git Bash)
pip install -r requirements.txt
```
