import os
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def normalize_password(password: str) -> str:
    """
    bcrypt supports a maximum password length of 72 bytes.
    Normalize password input so hashing and verification behave consistently.
    """
    if password is None:
        return ""

    encoded = password.encode("utf-8")[:72]
    return encoded.decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    return pwd_context.hash(normalize_password(password))


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(normalize_password(password), hashed)


def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "exp": expire,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
