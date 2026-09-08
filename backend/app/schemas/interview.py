from pydantic import BaseModel
from typing import List, Optional


class InterviewCreate(BaseModel):
    topic: str
    difficulty: str


class EvaluationResult(BaseModel):
    score: int
    correctness: str
    relevance: str
    clarity: str
    feedback: str


class QuestionResult(BaseModel):
    question_id: str
    question_text: str
    question_order: int
    answer_text: Optional[str] = None
    evaluation: Optional[EvaluationResult] = None


class InterviewResult(BaseModel):
    interview_id: str
    topic: str
    difficulty: str
    status: str
    average_score: float
    questions: List[QuestionResult]