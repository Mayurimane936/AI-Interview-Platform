import os

import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv

load_dotenv()


AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")


def synthesize_speech(text: str) -> bytes:
    if not AZURE_SPEECH_KEY:
        raise ValueError("AZURE_SPEECH_KEY is not set")

    if not AZURE_SPEECH_REGION:
        raise ValueError("AZURE_SPEECH_REGION is not set")

    speech_config = speechsdk.SpeechConfig(
        subscription=AZURE_SPEECH_KEY,
        region=AZURE_SPEECH_REGION,
    )

    speech_config.speech_synthesis_voice_name = (
        "en-US-Ava:DragonHDLatestNeural"
    )

    speech_config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3
    )

    synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config,
        audio_config=None,
    )

    result = synthesizer.speak_text_async(text).get()

    if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
        cancellation = speechsdk.SpeechSynthesisCancellationDetails(result)

        raise RuntimeError(
            f"Speech synthesis failed: "
            f"{cancellation.reason} - "
            f"{cancellation.error_details}"
        )

    return result.audio_data