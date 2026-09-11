import uuid
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class BulkDeleteInterviewsRequest(BaseModel):
    interview_ids: list[str]

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    topic = Column(
        String(100),
        nullable=False,
    )

    difficulty = Column(
        String(50),
        nullable=False,
    )

    status = Column(
        String(50),
        nullable=False,
        default="created",
    )

    started_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )