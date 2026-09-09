from fastapi import APIRouter, Depends, HTTPException
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.answer import Answer
from app.schemas.answer import AnswerCreate
from app.schemas.evaluation import EvaluationCreate
from app.models.evaluation import Evaluation
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.interview import Interview
from app.schemas.interview import InterviewCreate
from app.schemas.interview import (
    InterviewResult,
    QuestionResult,
    EvaluationResult,
)
from app.models.question import Question
from app.services.gemini import generate_text, evaluate_answer
import json
from datetime import datetime
from sqlalchemy import func

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


@router.get("/{interview_id}")
def get_interview(
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
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    return {
        "id": str(interview.id),
        "topic": interview.topic,
        "difficulty": interview.difficulty,
        "status": interview.status,
        "started_at": interview.started_at,
        "completed_at": interview.completed_at,
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
    # 1. Verify interview exists and belongs to current user
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

    # 2. Don't allow answers after interview is completed
    if interview.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Interview is already completed",
        )

    # 3. Verify question belongs to this interview
    question = (
        db.query(Question)
        .filter(
            Question.id == answer_data.question_id,
            Question.interview_id == interview_id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found for this interview",
        )
    
     # 4. if exisiting answer/ already answered
    existing_answer = (
        db.query(Answer)
        .filter(
            Answer.interview_id == interview_id,
            Answer.question_id == answer_data.question_id,
        )
        .first()
    )

    if existing_answer:
        raise HTTPException(
            status_code=400,
            detail="This question has already been answered",
        )


    # 5. Create answer
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

@router.post("/{interview_id}/evaluations")
def create_evaluation(
    interview_id: str,
    evaluation_data: EvaluationCreate,
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

    # 2. Verify answer belongs to this interview
    answer = (
        db.query(Answer)
        .filter(
            Answer.id == evaluation_data.answer_id,
            Answer.interview_id == interview_id,
        )
        .first()
    )

    if not answer:
        raise HTTPException(
            status_code=404,
            detail="Answer not found for this interview",
        )

    # 3. Verify question belongs to this interview
    question = (
        db.query(Question)
        .filter(
            Question.id == answer.question_id,
            Question.interview_id == interview_id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found for this interview",
        )

    # 4. Don't evaluate the same answer twice
    existing_evaluation = (
        db.query(Evaluation)
        .filter(
            Evaluation.answer_id == answer.id
        )
        .first()
    )

    if existing_evaluation:
        return {
            "message": "This answer has already been evaluated",
            "evaluation": {
                "id": str(existing_evaluation.id),
                "answer_id": str(existing_evaluation.answer_id),
                "score": existing_evaluation.score,
                "correctness": existing_evaluation.correctness,
                "relevance": existing_evaluation.relevance,
                "clarity": existing_evaluation.clarity,
                "feedback": existing_evaluation.feedback,
            },
        }

    # 5. Send answer to AI
    ai_response = evaluate_answer(
        question.question_text,
        answer.answer_text,
    )

    # 6. Parse AI response
    try:
        evaluation_result = json.loads(ai_response)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="AI returned an invalid evaluation response",
        )

    # 7. Save evaluation
    evaluation = Evaluation(
        answer_id=answer.id,
        score=evaluation_result["score"],
        correctness=evaluation_result["correctness"],
        relevance=evaluation_result["relevance"],
        clarity=evaluation_result["clarity"],
        feedback=evaluation_result["feedback"],
    )

    db.add(evaluation)

    try:
        db.commit()
        db.refresh(evaluation)

    except IntegrityError:
        db.rollback()

        existing_evaluation = (
            db.query(Evaluation)
            .filter(
                Evaluation.answer_id == answer.id
            )
            .first()
        )

        if existing_evaluation:
            return {
                "message": "This answer has already been evaluated",
                "evaluation": {
                    "id": str(existing_evaluation.id),
                    "answer_id": str(existing_evaluation.answer_id),
                    "score": existing_evaluation.score,
                    "correctness": existing_evaluation.correctness,
                    "relevance": existing_evaluation.relevance,
                    "clarity": existing_evaluation.clarity,
                    "feedback": existing_evaluation.feedback,
                },
            }

        raise

    # 8. Return evaluation
    return {
        "id": str(evaluation.id),
        "answer_id": str(evaluation.answer_id),
        "score": evaluation.score,
        "correctness": evaluation.correctness,
        "relevance": evaluation.relevance,
        "clarity": evaluation.clarity,
        "feedback": evaluation.feedback,
    }

@router.post("/{interview_id}/complete")
def complete_interview(
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

    if interview.status == "completed":
        average_score = (
            db.query(func.avg(Evaluation.score))
            .join(Answer, Answer.id == Evaluation.answer_id)
            .join(Question, Question.id == Answer.question_id)
            .filter(
                Question.interview_id == interview_id
            )
            .scalar()
        )

        return {
            "message": "Interview already completed",
            "id": str(interview.id),
            "status": interview.status,
            "completed_at": interview.completed_at,
            "average_score": round(float(average_score), 2)
            if average_score is not None
            else 0,
        }

    average_score = (
        db.query(func.avg(Evaluation.score))
        .join(Answer, Answer.id == Evaluation.answer_id)
        .join(Question, Question.id == Answer.question_id)
        .filter(
            Question.interview_id == interview_id
        )
        .scalar()
    )

    interview.status = "completed"
    interview.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(interview)

    return {
        "id": str(interview.id),
        "status": interview.status,
        "completed_at": interview.completed_at,
        "average_score": round(float(average_score), 2)
        if average_score is not None
        else 0,
    }


@router.get("/{interview_id}/result", response_model=InterviewResult)
def get_interview_result(
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
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    questions = (
        db.query(Question)
        .filter(
            Question.interview_id == interview_id
        )
        .order_by(Question.question_order)
        .all()
    )

    results = []

    total_score = 0
    evaluated_count = 0

    for question in questions:

        answer = (
            db.query(Answer)
            .filter(
                Answer.question_id == question.id
            )
            .first()
        )

        evaluation = None

        if answer:
            evaluation = (
                db.query(Evaluation)
                .filter(
                    Evaluation.answer_id == answer.id
                )
                .first()
            )

        evaluation_result = None

        if evaluation:
            total_score += evaluation.score
            evaluated_count += 1

            evaluation_result = EvaluationResult(
                score=evaluation.score,
                correctness=evaluation.correctness,
                relevance=evaluation.relevance,
                clarity=evaluation.clarity,
                feedback=evaluation.feedback,
            )

        results.append(
            QuestionResult(
                question_id=str(question.id),
                question_text=question.question_text,
                question_order=question.question_order,
                answer_text=answer.answer_text if answer else None,
                evaluation=evaluation_result,
            )
        )

    average_score = (
        total_score / evaluated_count
        if evaluated_count > 0
        else 0
    )

    return InterviewResult(
        interview_id=str(interview.id),
        topic=interview.topic,
        difficulty=interview.difficulty,
        status=interview.status,
        average_score=round(average_score, 2),
        questions=results,
    )