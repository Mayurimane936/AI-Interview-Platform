from fastapi import APIRouter

from app.core.redis import redis_client

router = APIRouter()


@router.get("/redis")
def redis_health():

    redis_client.set(
        "health_check",
        "working",
        ex=60,
    )

    value = redis_client.get("health_check")

    return {
        "redis": value
    }