from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.gemini import generate_text

router = APIRouter()


@router.get("/database")
def database_health(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))
    return {
        "database": result.scalar()
    }

@router.get("/test-gemini")
def test_gemini():
    result = generate_text(
        "Answer in one sentence: What is meaning of Mayuri"
    )

    return {
        "response": result
    }