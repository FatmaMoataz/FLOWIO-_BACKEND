# ai_service/main.py
# ─────────────────────────────────────────────────────────────────────────────
# Python FastAPI service that receives audio from Node.js,
# transcribes it, summarizes it, and extracts action items.
#
# Install dependencies:
#   pip install fastapi uvicorn openai-whisper transformers torch python-multipart
#
# Run with:
#   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# ─────────────────────────────────────────────────────────────────────────────

import json
import os
import tempfile
from datetime import datetime
from typing import List, Optional

import whisper
import torch
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="Flowio AI Service")

# ── Load models once at startup (heavy — takes ~30s) ──────────────────────────
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")  # options: tiny, base, small, medium, large

print("Loading summarization model...")
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

print("AI models ready.")

# ── Schemas ────────────────────────────────────────────────────────────────────

class ExtractedTask(BaseModel):
    title: str
    description: Optional[str] = None
    assignedTo: Optional[str] = None   # User ID matched from attendees
    priority: str = "medium"
    deadline: Optional[str] = None

class AIResponse(BaseModel):
    transcript: str
    summary: str
    tasks: List[ExtractedTask]

# ── Main endpoint ──────────────────────────────────────────────────────────────

@app.post("/ai/process-meeting", response_model=AIResponse)
async def process_meeting(
    audio: UploadFile = File(...),
    meeting_id: str = Form(...),
    attendees: str = Form(default="[]")  # JSON string: [{ id, name }]
):
    attendee_list = json.loads(attendees)

    # 1. Save audio to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # 2. Transcribe with Whisper
        print(f"[{meeting_id}] Transcribing audio...")
        result = whisper_model.transcribe(tmp_path)
        transcript = result["text"]
        print(f"[{meeting_id}] Transcript length: {len(transcript)} chars")

        # 3. Summarize the transcript
        print(f"[{meeting_id}] Summarizing...")
        # BART has a token limit — chunk if transcript is long
        max_chunk = 1024
        if len(transcript) > max_chunk:
            chunks = [transcript[i:i+max_chunk] for i in range(0, len(transcript), max_chunk)]
            summaries = [summarizer(chunk, max_length=150, min_length=30, do_sample=False)[0]["summary_text"]
                         for chunk in chunks]
            summary = " ".join(summaries)
        else:
            summary = summarizer(transcript, max_length=150, min_length=30, do_sample=False)[0]["summary_text"]

        # 4. Extract action items from transcript
        print(f"[{meeting_id}] Extracting tasks...")
        tasks = extract_tasks(transcript, attendee_list)

        return AIResponse(transcript=transcript, summary=summary, tasks=tasks)

    finally:
        os.unlink(tmp_path)  # clean up temp file


# ── Task extraction logic ──────────────────────────────────────────────────────

def extract_tasks(transcript: str, attendees: list) -> List[ExtractedTask]:
    """
    Simple keyword-based task extractor.
    Replace with a proper NLP model (GPT-4, Llama, etc.) for production.
    Keywords that signal an action item:
      "will do", "needs to", "should", "action item", "todo", "assign to", "by [name]"
    """
    import re
    tasks = []
    sentences = transcript.split(".")

    action_keywords = [
        "will", "needs to", "should", "must", "going to",
        "action item", "todo", "task", "assign", "responsible for"
    ]

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        sentence_lower = sentence.lower()
        if any(kw in sentence_lower for kw in action_keywords):
            # Try to match an attendee name to assign the task
            assigned_id = None
            for attendee in attendees:
                if attendee["name"].lower() in sentence_lower:
                    assigned_id = attendee["id"]
                    break

            # Determine priority from keywords
            priority = "medium"
            if any(w in sentence_lower for w in ["urgent", "asap", "immediately", "critical"]):
                priority = "high"
            elif any(w in sentence_lower for w in ["low priority", "whenever", "optional"]):
                priority = "low"

            tasks.append(ExtractedTask(
                title=sentence[:80],  # trim to 80 chars for the task title
                description=sentence,
                assignedTo=assigned_id,
                priority=priority
            ))

    return tasks[:10]  # cap at 10 tasks per meeting


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "models": ["whisper-base", "bart-large-cnn"]}