from pydantic import BaseModel


class InterviewCreate(BaseModel):
    topic: str
    difficulty: str