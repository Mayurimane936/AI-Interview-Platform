from fastapi import APIRouter, Depends, HTTPException
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.answer import Answer
from app.schemas.answer import AnswerCreate
from app.schemas.evaluation import EvaluationCreate
from app.models.evaluation import Evaluation
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.interview import Interview, BulkDeleteInterviewsRequest
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
from fastapi import Query
from pydantic import BaseModel
from typing import Literal
from app.data.technical_topics import (
    get_all_categories,
    get_topics_for_category,
    search_topics,
    normalize_category,
    is_valid_topic,
)

router = APIRouter()


class CustomTopicInterviewCreate(BaseModel):
    """Request used when a topic is not present in the technical topic catalogue."""

    category: str
    topic: str
    difficulty: Literal["easy", "medium", "hard"]
    interview_mode: Literal["timed", "untimed"] = "untimed"


QUESTION_TIMES = {
    "easy": 180,      # 3 minutes
    "medium": 300,    # 5 minutes
    "hard": 480,      # 8 minutes
}
# =========================================================
# TECHNICAL CATEGORIES
# =========================================================

@router.get("/categories")
def get_interview_categories():
    return {
        "categories": get_all_categories()
    }


# =========================================================
# TECHNICAL TOPICS
# =========================================================

@router.get("/topics")
def get_interview_topics(
    category: str = Query(...),
    search: str | None = Query(default=None),
):
    normalized_category = normalize_category(category)

    if not normalized_category:
        raise HTTPException(
            status_code=404,
            detail="Technical category not found",
        )

    if search and search.strip():
        topics = search_topics(
            search,
            normalized_category,
        )
    else:
        topics = get_topics_for_category(
            normalized_category
        )

    return {
        "category": normalized_category,
        "topics": topics,
    }



@router.post("")
def create_interview(
    interview_data: InterviewCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # =========================================================
    # 1. VERIFY TOPIC EXISTS IN THE TECHNICAL CATALOGUE
    # =========================================================

    topic = interview_data.topic.strip()

    if not topic:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid technical interview topic.",
        )

    # Normal interview creation is only for topics already present
    # in technical_topics.py. Unknown topics should use the
    # /custom-topic endpoint from the \"Can't find your topic?\" flow.
    if not is_valid_topic(topic):
        raise HTTPException(
            status_code=404,
            detail="Topic not found in the technical catalogue. Use the custom topic option to enter it.",
        )

    # =========================================================
    # 2. CREATE INTERVIEW
    # =========================================================

    interview = Interview(
        user_id=user_id,
        topic=topic,
        difficulty=interview_data.difficulty,
        interview_mode=interview_data.interview_mode,
        question_time_seconds=(
            QUESTION_TIMES[interview_data.difficulty]
            if interview_data.interview_mode == "timed"
            else None
        ),
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    # =========================================================
    # 2. GET PREVIOUS QUESTIONS
    #    Same user + same topic + same difficulty
    # =========================================================

    existing_question_rows = (
        db.query(Question.question_text)
        .join(
            Interview,
            Question.interview_id == Interview.id
        )
        .filter(
            Interview.user_id == user_id,
            Interview.topic == interview.topic,
            Interview.difficulty == interview.difficulty,
        )
        .all()
    )

    existing_questions = [
        row[0]
        for row in existing_question_rows
    ]

    print(
        f"Found {len(existing_questions)} "
        f"previous questions for "
        f"{interview.topic} / {interview.difficulty}"
    )

    # =========================================================
    # 3. GENERATE NEW QUESTIONS
    # =========================================================

    prompt = f"""
You are an expert technical interviewer.

Generate exactly 5 interview questions for:

Topic: {interview.topic}
Difficulty: {interview.difficulty}

The questions should test understanding of the topic
at the requested difficulty level.

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
- Questions must match the requested topic.
- Questions must match the requested difficulty.
- Do not include markdown.
- Do not include any text outside the JSON.
"""

    ai_response = generate_text(
        prompt,
        existing_questions,
    )

    questions_data = json.loads(ai_response)

    # =========================================================
    # 4. SAVE QUESTIONS
    # =========================================================

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

    # =========================================================
    # 5. RESPONSE
    # =========================================================

    return {
        "id": str(interview.id),
        "topic": interview.topic,
        "difficulty": interview.difficulty,
        "status": interview.status,
    }


@router.post("/custom-topic")
def create_custom_topic_interview(
    interview_data: CustomTopicInterviewCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Custom-topic flow.

    The frontend reaches this endpoint only after the user searched the
    existing catalogue and the topic was not found.

    One Gemini call performs both:
    1. technical/software-topic validation
    2. interview-question generation

    Invalid topics are rejected before an Interview row is created.
    """

    topic = interview_data.topic.strip()

    if not topic:
        raise HTTPException(
            status_code=400,
            detail="Please enter a topic.",
        )

    normalized_category = normalize_category(
        interview_data.category
    )

    if not normalized_category:
        raise HTTPException(
            status_code=404,
            detail="Technical category not found.",
        )

    # A custom topic must genuinely be new. Existing catalogue topics
    # should continue through the normal search/select flow.
    if is_valid_topic(topic):
        raise HTTPException(
            status_code=409,
            detail="This topic already exists in the technical catalogue. Please select it from the topic suggestions.",
        )

    # =========================================================
    # 1. GET PREVIOUS QUESTIONS
    # =========================================================

    existing_question_rows = (
        db.query(Question.question_text)
        .join(
            Interview,
            Question.interview_id == Interview.id
        )
        .filter(
            Interview.user_id == user_id,
            Interview.topic == topic,
            Interview.difficulty == interview_data.difficulty,
        )
        .all()
    )

    existing_questions = [
        row[0]
        for row in existing_question_rows
    ]

    # =========================================================
    # 2. SINGLE AI CALL: VALIDATE + GENERATE
    # =========================================================

    prompt = f"""
You are an expert technical interviewer.

User-entered topic:
{topic}

Selected category:
{normalized_category}

Difficulty:
{interview_data.difficulty}

First determine whether the user-entered topic is a legitimate
software, programming, computer science, engineering, cloud,
DevOps, data, AI/ML, security, or other technology interview topic.

If it is NOT a valid software/technical interview topic:
- Set "is_technical" to false.
- Return an empty "questions" array.
- Do not try to reinterpret an unrelated topic as technical.

If it IS a valid software/technical interview topic:
- Set "is_technical" to true.
- Normalize the topic name into a concise, professional interview-topic name.
- Generate exactly 5 interview questions for the normalized topic.
- Questions must match the requested difficulty.
- question_type must be "technical".
- question_order must be 1, 2, 3, 4, 5.

Return ONLY valid JSON in this exact structure:

{{
    "is_technical": true,
    "normalized_topic": "Kubernetes Operators",
    "questions": [
        {{
            "question_text": "question here",
            "question_type": "technical",
            "difficulty": "{interview_data.difficulty}",
            "question_order": 1
        }}
    ]
}}

For an invalid topic, return:

{{
    "is_technical": false,
    "normalized_topic": null,
    "questions": []
}}

Rules:
- Do not include markdown.
- Do not include text outside the JSON.
- Do not invent an unrelated technical interpretation for a
  non-technical topic.
"""

    try:
        ai_response = generate_text(
            prompt,
            existing_questions,
        )
        result = json.loads(ai_response)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="AI returned an invalid topic validation response.",
        )
    except Exception as exc:
        print(f"CUSTOM TOPIC AI ERROR: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Unable to validate and generate questions for this topic.",
        )

    is_technical = result.get("is_technical") is True
    normalized_topic = (
        str(result.get("normalized_topic") or "").strip()
        if is_technical
        else ""
    )
    questions_data = result.get("questions")

    if not is_technical:
        raise HTTPException(
            status_code=422,
            detail="Please enter a valid software or technical interview topic.",
        )

    if not normalized_topic:
        raise HTTPException(
            status_code=502,
            detail="AI did not return a valid normalized topic.",
        )

    if not isinstance(questions_data, list) or len(questions_data) != 5:
        raise HTTPException(
            status_code=502,
            detail="AI did not return exactly 5 interview questions.",
        )

    # Do not allow AI to turn a rejected/new topic into a duplicate
    # of an existing catalogue topic without normalizing through the
    # same catalogue flow.
    if is_valid_topic(normalized_topic):
        raise HTTPException(
            status_code=409,
            detail="This topic already exists in the technical catalogue. Please use the existing topic instead.",
        )

    # =========================================================
    # 3. CREATE INTERVIEW ONLY AFTER VALIDATION SUCCEEDS
    # =========================================================

    interview = Interview(
        user_id=user_id,
        topic=normalized_topic,
        difficulty=interview_data.difficulty,
        interview_mode=interview_data.interview_mode,
        question_time_seconds=(
            QUESTION_TIMES[interview_data.difficulty]
            if interview_data.interview_mode == "timed"
            else None
        ),
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    # =========================================================
    # 4. SAVE GENERATED QUESTIONS
    # =========================================================

    try:
        for question in questions_data:
            new_question = Question(
                interview_id=interview.id,
                question_text=question["question_text"],
                question_type="technical",
                difficulty=interview_data.difficulty,
                question_order=question["question_order"],
            )
            db.add(new_question)

        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to save generated interview questions.",
        )

    return {
        "id": str(interview.id),
        "topic": interview.topic,
        "difficulty": interview.difficulty,
        "status": interview.status,
        "interview_mode": interview.interview_mode,
        "question_time_seconds": interview.question_time_seconds,
        "topic_source": "custom",
        "catalogue_update_required": True,
        "catalogue_category": normalized_category,
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
        "interview_mode": interview.interview_mode,
        "question_time_seconds": interview.question_time_seconds,
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




@router.delete("/bulk")
def delete_interviews_bulk(
    request: BulkDeleteInterviewsRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not request.interview_ids:
        raise HTTPException(
            status_code=400,
            detail="No interviews selected",
        )

    try:
        # =====================================================
        # 1. Find only interviews owned by current user
        # =====================================================

        interviews = (
            db.query(Interview)
            .filter(
                Interview.id.in_(request.interview_ids),
                Interview.user_id == user_id,
            )
            .all()
        )

        if not interviews:
            raise HTTPException(
                status_code=404,
                detail="No matching interviews found",
            )

        interview_ids = [
            interview.id
            for interview in interviews
        ]

        # =====================================================
        # 2. Get answers
        # =====================================================

        answers = (
            db.query(Answer)
            .filter(
                Answer.interview_id.in_(
                    interview_ids
                )
            )
            .all()
        )

        answer_ids = [
            answer.id
            for answer in answers
        ]

        # =====================================================
        # 3. Delete evaluations
        # =====================================================

        if answer_ids:
            db.query(Evaluation).filter(
                Evaluation.answer_id.in_(answer_ids)
            ).delete(
                synchronize_session=False
            )

        # =====================================================
        # 4. Delete answers
        # =====================================================

        if interview_ids:
            db.query(Answer).filter(
                Answer.interview_id.in_(interview_ids)
            ).delete(
                synchronize_session=False
            )

        # =====================================================
        # 5. Delete questions
        # =====================================================

        db.query(Question).filter(
            Question.interview_id.in_(interview_ids)
        ).delete(
            synchronize_session=False
        )

        # =====================================================
        # 6. Delete interviews
        # =====================================================

        db.query(Interview).filter(
            Interview.id.in_(interview_ids)
        ).delete(
            synchronize_session=False
        )

        db.commit()

        return {
            "message": "Interviews deleted successfully",
            "deleted_count": len(interview_ids),
            "deleted_interview_ids": [
                str(interview_id)
                for interview_id in interview_ids
            ],
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete interviews",
        )



@router.delete("/{interview_id}")
def delete_interview(
    interview_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # =========================================================
    # 1. Find interview and verify ownership
    # =========================================================

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

    try:
        # =====================================================
        # 2. Find answers belonging to this interview
        # =====================================================

        answers = (
            db.query(Answer)
            .filter(
                Answer.interview_id == interview_id
            )
            .all()
        )

        # =====================================================
        # 3. Delete evaluations first
        # =====================================================

        for answer in answers:
            db.query(Evaluation).filter(
                Evaluation.answer_id == answer.id
            ).delete(
                synchronize_session=False
            )

        # =====================================================
        # 4. Delete answers
        # =====================================================

        db.query(Answer).filter(
            Answer.interview_id == interview_id
        ).delete(
            synchronize_session=False
        )

        # =====================================================
        # 5. Delete questions
        # =====================================================

        db.query(Question).filter(
            Question.interview_id == interview_id
        ).delete(
            synchronize_session=False
        )

        # =====================================================
        # 6. Delete interview
        # =====================================================

        db.delete(interview)

        db.commit()

        return {
            "message": "Interview deleted successfully",
            "interview_id": interview_id,
        }

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete interview",
        )

