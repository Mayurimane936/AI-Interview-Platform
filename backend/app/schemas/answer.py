
from pydantic import BaseModel


class AnswerCreate(BaseModel):
    interview_id: str
    question_id: str
    answer_text: str