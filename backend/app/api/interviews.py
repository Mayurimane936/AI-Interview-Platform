from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.answer import Answer
from app.schemas.answer import AnswerCreate
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.interview import Interview
from app.schemas.interview import InterviewCreate
from app.models.question import Question
from app.services.gemini import generate_text
import json
from datetime import datetime

router = APIRouter()


@router.post("")
def create_interview(
    interview_data: InterviewCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = Interview(
        user_id=user_id,
        topic=interview_data.topic,
        difficulty=interview_data.difficulty,
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    prompt = f"""
    You are an expert technical interviewer.

    Generate exactly 5 interview questions for:
    Topic: {interview.topic}
    Difficulty: {interview.difficulty}

    Return ONLY valid JSON in this exact format:

    [
    {{
        "question_text": "question here",
        "question_type": "technical",
        "difficulty": "{interview.difficulty}",
        "question_order": 1
    }}
    ]

    Rules:
    - Generate exactly 5 questions.
    - question_type must be "technical".
    - question_order must be 1, 2, 3, 4, 5.
    - Do not include markdown.
    - Do not include any text outside the JSON.
    """

    ai_response = generate_text(prompt)
    questions_data = json.loads(ai_response)


    for question in questions_data:
        new_question = Question(
            interview_id=interview.id,
            question_text=question["question_text"],
            question_type=question["question_type"],
            difficulty=question["difficulty"],
            question_order=question["question_order"],
        )

        db.add(new_question)

    db.commit()

    return {
        "id": str(interview.id),
        "topic": interview.topic,
        "difficulty": interview.difficulty,
        "status": interview.status,
    }

@router.get("/{interview_id}/questions")
def get_interview_questions(
    interview_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == user_id,
        )
        .first()
    )

    if not interview:
        return {
            "message": "Interview not found"
        }

    questions = (
        db.query(Question)
        .filter(
            Question.interview_id == interview_id
        )
        .order_by(Question.question_order)
        .all()
    )

    return [
        {
            "id": str(question.id),
            "question_text": question.question_text,
            "question_type": question.question_type,
            "difficulty": question.difficulty,
            "question_order": question.question_order,
        }
        for question in questions
    ]

@router.post("/{interview_id}/start")
def start_interview(
    interview_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == user_id,
        )
        .first()
    )

    if not interview:
        return {
            "message": "Interview not found"
        }

    interview.status = "in_progress"
    interview.started_at = datetime.utcnow()

    db.commit()
    db.refresh(interview)

    return {
        "id": str(interview.id),
        "status": interview.status,
        "started_at": interview.started_at,
    }

@router.post("/{interview_id}/answers")
def submit_answer(
    interview_id: str,
    answer_data: AnswerCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == user_id,
        )
        .first()
    )

    if not interview:
        return {
            "message": "Interview not found"
        }

    answer = Answer(
        interview_id=interview_id,
        question_id=answer_data.question_id,
        answer_text=answer_data.answer_text,
    )

    db.add(answer)
    db.commit()
    db.refresh(answer)

    return {
        "id": str(answer.id),
        "interview_id": str(answer.interview_id),
        "question_id": str(answer.question_id),
        "answer_text": answer.answer_text,
    }