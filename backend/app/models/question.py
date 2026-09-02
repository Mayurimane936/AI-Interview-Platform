import uuid

from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Question(Base):
    __tablename__ = "questions"

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

    question_text = Column(
        Text,
        nullable=False,
    )

    question_type = Column(
        String(50),
        nullable=False,
    )

    difficulty = Column(
        String(50),
        nullable=False,
    )

    question_order = Column(
        Integer,
        nullable=False,
    )