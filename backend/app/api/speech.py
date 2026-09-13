from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.services.tts import synthesize_speech


router = APIRouter()


class SpeechRequest(BaseModel):
    text: str


@router.post("/synthesize")
def synthesize(request: SpeechRequest):
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty",
        )

    try:
        audio_data = synthesize_speech(
            request.text.strip()
        )

        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": 'inline; filename="speech.mp3"'
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech synthesis failed: {str(e)}",
        )