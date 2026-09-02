from pydantic import BaseModel


class QuestionCreate(BaseModel):
    interview_id: str
    question_text: str
    question_type: str
    difficulty: str
    question_order: int