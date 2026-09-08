import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Answer(Base):
    __tablename__ = "answers"

    __table_args__ = (
        UniqueConstraint(
            "interview_id",
            "question_id",
            name="uq_answers_interview_question",
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    interview_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interviews.id"),
        nullable=False,
    )

    question_id = Column(
        UUID(as_uuid=True),
        ForeignKey("questions.id"),
        nullable=False,
    )

    answer_text = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )