from app.services.stt import recognize_speech


audio_file = "test_audio.mp3"

text = recognize_speech(audio_file)

print("Recognized speech:")
print(text)