import { API_URL } from "./config";

export async function synthesizeSpeech(text) {
    const response = await fetch(
        `${API_URL}/speech/synthesize`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text,
            }),
        }
    );

    if (!response.ok) {
        let message = "Failed to generate speech.";

        try {
            const data = await response.json();
            message = data?.detail || message;
        } catch {
            // Response was not JSON.
        }

        throw new Error(message);
    }

    const audioBlob = await response.blob();

    return URL.createObjectURL(audioBlob);
}