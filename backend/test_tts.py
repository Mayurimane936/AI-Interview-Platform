from app.services.tts import synthesize_speech


synthesize_speech(
    "Hello Mayuri, this is your AI interviewer. Welcome to the interview.",
    "test_tts.mp3",
)

print("Speech synthesis completed successfully.")