import os

import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv

load_dotenv()

AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")


def recognize_speech(audio_file: str) -> str:
    if not AZURE_SPEECH_KEY:
        raise ValueError("AZURE_SPEECH_KEY is not set")

    if not AZURE_SPEECH_REGION:
        raise ValueError("AZURE_SPEECH_REGION is not set")

    speech_config = speechsdk.SpeechConfig(
        subscription=AZURE_SPEECH_KEY,
        region=AZURE_SPEECH_REGION,
    )

    speech_config.speech_recognition_language = "en-US"

    audio_config = speechsdk.audio.AudioConfig(
        filename=audio_file
    )

    print("Creating SpeechRecognizer...")
    
    recognizer = speechsdk.SpeechRecognizer(
        speech_config=speech_config,
        audio_config=audio_config,
    )

    print("SpeechRecognizer created successfully.")

    result = recognizer.recognize_once_async().get()

    print("Recognition result reason:", result.reason)

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        return result.text

    if result.reason == speechsdk.ResultReason.NoMatch:
        raise RuntimeError("No speech could be recognized.")

    if result.reason == speechsdk.ResultReason.Canceled:
        cancellation = result.cancellation_details

        print("Cancellation reason:", cancellation.reason)
        print("Cancellation error details:", cancellation.error_details)

        raise RuntimeError(
            f"Speech recognition canceled: "
            f"{cancellation.reason} - "
            f"{cancellation.error_details}"
        )

    raise RuntimeError("Speech recognition failed.")