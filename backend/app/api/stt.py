from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.stt import recognize_speech


router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Audio file type is missing.",
        )

    allowed_types = {
        "audio/wav",
        "audio/x-wav",
        "audio/wave",
        "audio/mpeg",
        "audio/mp3",
        "audio/webm",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio type: {file.content_type}",
        )

    try:
        suffix = Path(file.filename or "audio.wav").suffix or ".wav"

        with NamedTemporaryFile(
            suffix=suffix,
            delete=True,
        ) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()

            transcript = recognize_speech(
                temp_file.name
            )

        return {
            "transcript": transcript
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech recognition failed: {str(e)}",
        )