const API_URL = "http://127.0.0.1:8000";

export async function transcribeAudio(audioBlob) {
    const formData = new FormData();

    formData.append("file", audioBlob, "answer.wav");

    const response = await fetch(
        `${API_URL}/stt/transcribe`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        let message = "Failed to transcribe audio.";

        try {
            const data = await response.json();
            message = data?.detail || message;
        } catch {
            // Response was not JSON.
        }

        throw new Error(message);
    }

    return response.json();
}