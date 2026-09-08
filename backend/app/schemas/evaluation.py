from pydantic import BaseModel


class EvaluationCreate(BaseModel):
    answer_id: str
  