from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.question import Question
from app.schemas.question import QuestionCreate

router = APIRouter()


@router.post("")
def create_question(
    question_data: QuestionCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = Question(
        interview_id=question_data.interview_id,
        question_text=question_data.question_text,
        question_type=question_data.question_type,
        difficulty=question_data.difficulty,
        question_order=question_data.question_order,
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return {
        "id": str(question.id),
        "interview_id": str(question.interview_id),
        "question_text": question.question_text,
        "question_type": question.question_type,
        "difficulty": question.difficulty,
        "question_order": question.question_order,
    }