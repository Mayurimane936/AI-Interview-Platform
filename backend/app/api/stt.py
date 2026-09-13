from pathlib import Path
from tempfile import NamedTemporaryFile
import requests
from app.services.stt import recognize_speech
from fastapi import APIRouter, File, HTTPException, UploadFile
import os


router = APIRouter()

@router.get("/token")
def get_speech_token():
    speech_key = os.getenv("AZURE_SPEECH_KEY")
    speech_region = os.getenv("AZURE_SPEECH_REGION")

    if not speech_key:
        raise HTTPException(
            status_code=500,
            detail="AZURE_SPEECH_KEY is not configured.",
        )

    if not speech_region:
        raise HTTPException(
            status_code=500,
            detail="AZURE_SPEECH_REGION is not configured.",
        )

    token_url = (
        f"https://{speech_region}.api.cognitive.microsoft.com/"
        "sts/v1.0/issueToken"
    )

    try:
        response = requests.post(
            token_url,
            headers={
                "Ocp-Apim-Subscription-Key": speech_key
            },
            timeout=10,
        )

        response.raise_for_status()

        return {
            "token": response.text,
            "region": speech_region,
        }

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to obtain Azure Speech token: {exc}",
        )

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