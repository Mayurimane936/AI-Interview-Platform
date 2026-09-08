from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.evaluation import Evaluation


router = APIRouter()


@router.get("/{interview_id}")
def get_interview_analytics(
    interview_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Verify interview belongs to current user
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == user_id,
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    # 2. Total questions
    total_questions = (
        db.query(func.count(Question.id))
        .filter(
            Question.interview_id == interview_id
        )
        .scalar()
    )

    # 3. Answered questions
    answered_questions = (
        db.query(func.count(func.distinct(Answer.question_id)))
        .filter(
            Answer.interview_id == interview_id
        )
        .scalar()
    )

    # 4. Evaluated answers
    evaluated_questions = (
        db.query(func.count(Evaluation.id))
        .join(
            Answer,
            Answer.id == Evaluation.answer_id,
        )
        .filter(
            Answer.interview_id == interview_id
        )
        .scalar()
    )

    # 5. Average score
    average_score = (
        db.query(func.avg(Evaluation.score))
        .join(
            Answer,
            Answer.id == Evaluation.answer_id,
        )
        .filter(
            Answer.interview_id == interview_id
        )
        .scalar()
    )

    # 6. Highest score
    highest_score = (
        db.query(func.max(Evaluation.score))
        .join(
            Answer,
            Answer.id == Evaluation.answer_id,
        )
        .filter(
            Answer.interview_id == interview_id
        )
        .scalar()
    )

    # 7. Lowest score
    lowest_score = (
        db.query(func.min(Evaluation.score))
        .join(
            Answer,
            Answer.id == Evaluation.answer_id,
        )
        .filter(
            Answer.interview_id == interview_id
        )
        .scalar()
    )

    # 8. Completion percentage
    completion_percentage = (
        round(
            (answered_questions / total_questions) * 100,
            2,
        )
        if total_questions > 0
        else 0
    )

    # 9. Performance classification
    excellent = 0
    good = 0
    needs_improvement = 0

    scores = (
        db.query(Evaluation.score)
        .join(
            Answer,
            Answer.id == Evaluation.answer_id,
        )
        .filter(
            Answer.interview_id == interview_id
        )
        .all()
    )

    for (score,) in scores:
        if score >= 9:
            excellent += 1
        elif score >= 7:
            good += 1
        else:
            needs_improvement += 1

    return {
        "interview_id": str(interview.id),
        "topic": interview.topic,
        "difficulty": interview.difficulty,
        "status": interview.status,
        "total_questions": total_questions,
        "answered_questions": answered_questions,
        "evaluated_questions": evaluated_questions,
        "average_score": (
            round(float(average_score), 2)
            if average_score is not None
            else 0
        ),
        "highest_score": highest_score or 0,
        "lowest_score": lowest_score or 0,
        "completion_percentage": completion_percentage,
        "performance": {
            "excellent": excellent,
            "good": good,
            "needs_improvement": needs_improvement,
        },
    }