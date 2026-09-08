import os

from dotenv import load_dotenv
from google import genai


load_dotenv()


api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is not set")


client = genai.Client(api_key=api_key)


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

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json"
        },
    )

    return response.text