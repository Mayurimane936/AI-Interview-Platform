import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    __table_args__ = (
        UniqueConstraint("answer_id", name="uq_evaluations_answer_id"),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    answer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("answers.id"),
        nullable=False,
    )

    score = Column(
        Integer,
        nullable=False,
    )

    correctness = Column(
        Text,
        nullable=False,
    )

    relevance = Column(
        Text,
        nullable=False,
    )

    clarity = Column(
        Text,
        nullable=False,
    )

    feedback = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )