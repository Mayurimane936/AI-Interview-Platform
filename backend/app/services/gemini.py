import os

from dotenv import load_dotenv
from google import genai
from google.genai import errors


load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set")


client = genai.Client(api_key=GEMINI_API_KEY)


# Models will be tried in this order.
# The prompt and response format remain the same.
EVALUATION_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
]


def generate_text(prompt: str) -> str:
    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config={
            "response_mime_type": "application/json"
        },
    )

    return response.text


def evaluate_answer(question: str, answer: str) -> str:
    prompt = f"""
You are an expert technical interviewer.

Evaluate the candidate's answer to the following interview question.

Question:
{question}

Candidate Answer:
{answer}

Evaluate the answer based on:

1. Correctness
2. Relevance
3. Clarity

Give a score from 0 to 10.

Return ONLY valid JSON in exactly this format:

{{
    "score": 0,
    "correctness": "Your assessment",
    "relevance": "Your assessment",
    "clarity": "Your assessment",
    "feedback": "Specific feedback for the candidate"
}}

Rules:
- score must be an integer from 0 to 10.
- Be fair and technically accurate.
- Do not include markdown.
- Do not include any text outside the JSON.
"""

    last_error = None

    for model in EVALUATION_MODELS:

        try:
            print(
                f"Trying evaluation model: {model}"
            )

            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                },
            )

            print(
                f"Evaluation succeeded using: {model}"
            )

            return response.text

        except errors.ClientError as exc:

            last_error = exc

            # 429 = quota/rate-limit exhausted.
            if exc.code == 429:
                print(
                    f"Quota exceeded for {model}. "
                    "Trying next model..."
                )
                continue

            # Any other client error should not silently
            # switch models.
            raise

    # All configured models failed because of quota.
    if last_error:
        raise last_error

    raise RuntimeError(
        "No evaluation model was available"
    )