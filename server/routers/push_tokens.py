from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.database import get_db
from core.security import get_current_user

router = APIRouter(prefix="/api/push-tokens", tags=["push"])

@router.post("")
async def register_token(body: dict, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    token = body.get("token", "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="token required")
    db.execute(text(
        "INSERT INTO push_tokens (token, admin_id) VALUES (:t, :a) "
        "ON DUPLICATE KEY UPDATE admin_id=:a"
    ), {"t": token, "a": current_user.get("admin_id") or current_user.get("id")})
    db.commit()
    return {"success": True}
