from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.interview import Interview
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.data.technical_topics import (
    get_all_categories,
    get_topics_for_category,
    normalize_topic,
)


router = APIRouter()


# =========================================================
# PERIOD HELPER
# =========================================================

def get_period_range(period: str):
    now = datetime.now(timezone.utc)

    # -----------------------------------------------------
    # TODAY
    # -----------------------------------------------------

    if period == "today":
        start = now.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        end = now

        return start, end

    # -----------------------------------------------------
    # YESTERDAY
    # -----------------------------------------------------

    if period == "yesterday":
        today_start = now.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        yesterday_start = (
            today_start - timedelta(days=1)
        )

        return yesterday_start, today_start

    # -----------------------------------------------------
    # LAST 30 DAYS
    # -----------------------------------------------------

    if period == "30d":
        start = now - timedelta(days=30)

        return start, now

    # -----------------------------------------------------
    # DEFAULT = LAST 7 DAYS
    # -----------------------------------------------------

    start = now - timedelta(days=7)

    return start, now


# =========================================================
# INTERVIEW SERIALIZER
# =========================================================

def serialize_interview(
    interview: Interview,
    db: Session,
):
    # -----------------------------------------------------
    # TIME TAKEN
    # -----------------------------------------------------

    time_taken_seconds = None

    if (
        interview.started_at is not None
        and interview.completed_at is not None
    ):
        time_taken = (
            interview.completed_at
            - interview.started_at
        )

        time_taken_seconds = int(
            time_taken.total_seconds()
        )

    # -----------------------------------------------------
    # AVERAGE SCORE
    # -----------------------------------------------------

    interview_average_score = (
        db.query(func.avg(Evaluation.score))
        .join(
            Answer,
            Answer.id == Evaluation.answer_id,
        )
        .filter(
            Answer.interview_id == interview.id
        )
        .scalar()
    )

    if interview_average_score is not None:
        interview_average_score = round(
            float(interview_average_score),
            1,
        )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "id": str(interview.id),
        "topic": interview.topic,
        "difficulty": interview.difficulty,
        "status": interview.status,
        "created_at": interview.created_at,
        "started_at": interview.started_at,
        "completed_at": interview.completed_at,
        "time_taken_seconds": time_taken_seconds,
        "average_score": interview_average_score,
    }


# =========================================================
# DASHBOARD STATS
# =========================================================

@router.get("/stats")
def get_dashboard_stats(
    period: str = Query(
        default="7d",
        pattern="^(today|yesterday|7d|30d)$",
    ),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # =====================================================
    # PERIOD
    # =====================================================

    period_start, period_end = get_period_range(
        period
    )

    # =====================================================
    # BASE INTERVIEW FILTER
    # =====================================================

    interview_filter = (
        Interview.user_id == user_id,
        Interview.created_at >= period_start,
        Interview.created_at < period_end,
    )

    # =====================================================
    # TOTAL
    # =====================================================

    total_interviews = (
        db.query(func.count(Interview.id))
        .filter(*interview_filter)
        .scalar()
    ) or 0

    # =====================================================
    # STATUS COUNTS
    # =====================================================

    completed_interviews = (
        db.query(func.count(Interview.id))
        .filter(
            *interview_filter,
            Interview.status == "completed",
        )
        .scalar()
    ) or 0

    in_progress_interviews = (
        db.query(func.count(Interview.id))
        .filter(
            *interview_filter,
            Interview.status == "in_progress",
        )
        .scalar()
    ) or 0

    not_started_interviews = (
        db.query(func.count(Interview.id))
        .filter(
            *interview_filter,
            Interview.status == "created",
        )
        .scalar()
    ) or 0

    # =====================================================
    # OVERALL AVERAGE SCORE
    # =====================================================

    average_score = (
        db.query(func.avg(Evaluation.score))
        .join(
            Answer,
            Answer.id == Evaluation.answer_id,
        )
        .join(
            Interview,
            Interview.id == Answer.interview_id,
        )
        .filter(*interview_filter)
        .scalar()
    )

    if average_score is not None:
        average_score = round(
            float(average_score),
            1,
        )

    # =====================================================
    # FETCH INTERVIEWS BY STATUS
    # =====================================================

    completed_items = (
        db.query(Interview)
        .filter(
            *interview_filter,
            Interview.status == "completed",
        )
        .order_by(
            Interview.created_at.desc()
        )
        .all()
    )

    in_progress_items = (
        db.query(Interview)
        .filter(
            *interview_filter,
            Interview.status == "in_progress",
        )
        .order_by(
            Interview.created_at.desc()
        )
        .all()
    )

    not_started_items = (
        db.query(Interview)
        .filter(
            *interview_filter,
            Interview.status == "created",
        )
        .order_by(
            Interview.created_at.desc()
        )
        .all()
    )

    # =====================================================
    # SERIALIZE
    # =====================================================

    completed_list = [
        serialize_interview(
            interview,
            db,
        )
        for interview in completed_items
    ]

    in_progress_list = [
        serialize_interview(
            interview,
            db,
        )
        for interview in in_progress_items
    ]

    not_started_list = [
        serialize_interview(
            interview,
            db,
        )
        for interview in not_started_items
    ]

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "period": period,
        "period_start": period_start,
        "period_end": period_end,

        "total_interviews": total_interviews,

        "completed_interviews":
            completed_interviews,

        "in_progress_interviews":
            in_progress_interviews,

        "not_started_interviews":
            not_started_interviews,

        "average_score":
            average_score,

        "completed_list":
            completed_list,

        "in_progress_list":
            in_progress_list,

        "not_started_list":
            not_started_list,
    }

@router.get("/recent-practice")
def get_recent_practice(
    user_id=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(Interview.created_at.desc())
        .limit(20)
        .all()
    )

    # Build a topic -> category lookup from the technical topic catalogue.
    topic_category_map = {}

    for category in get_all_categories():
        category_value = category["value"]

        for catalogue_topic in get_topics_for_category(category_value):
            topic_category_map[
                normalize_topic(catalogue_topic)
            ] = category_value

    recent = []
    seen_topics = set()

    for interview in interviews:
        topic_key = normalize_topic(interview.topic)

        # Skip duplicate topics.
        if topic_key in seen_topics:
            continue

        seen_topics.add(topic_key)

        category_value = topic_category_map.get(topic_key)

        # If an older interview contains an alias such as "os",
        # try matching it against the catalogue's normalized topics.
        if not category_value:
            for catalogue_topic_key, candidate_category in topic_category_map.items():
                if (
                    topic_key == catalogue_topic_key
                    or topic_key in catalogue_topic_key
                    or catalogue_topic_key in topic_key
                ):
                    category_value = candidate_category
                    break

        category_label = None

        if category_value:
            category = next(
                (
                    item
                    for item in get_all_categories()
                    if item["value"] == category_value
                ),
                None,
            )

            if category:
                category_label = category.get("label")

        recent.append({
            "interview_id": str(interview.id),
            "topic": interview.topic,
            "category": category_value,
            "categoryLabel": category_label,
            "difficulty": interview.difficulty,
            "status": interview.status,
            "created_at": interview.created_at.isoformat(),
        })

        if len(recent) >= 6:
            break

    return {
        "recent_practice": recent
    }