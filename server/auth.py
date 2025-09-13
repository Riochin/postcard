import os
import jwt
import requests
from typing import Dict
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from functools import lru_cache

security = HTTPBearer()

# Cognito設定
COGNITO_REGION = os.getenv("COGNITO_REGION", "us-east-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

if not COGNITO_USER_POOL_ID:
    pass

# JWKSエンドポイント
JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"


@lru_cache(maxsize=1)
def get_jwks() -> Dict:
    """Cognito JWKSを取得してキャッシュ"""
    try:
        response = requests.get(JWKS_URL)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Failed to fetch JWKS: {e}")
        return {"keys": []}


def get_signing_key(token: str) -> str:
    """JWTトークンから署名キーを取得"""
    try:
        # JWT ヘッダーからkidを取得
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        if not kid:
            raise HTTPException(
                status_code=401, detail="Invalid token: no kid in header"
            )

        # JWKSからマッチするキーを見つける
        jwks = get_jwks()
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                # RSA公開キーを構築
                from jwt.algorithms import RSAAlgorithm

                return RSAAlgorithm.from_jwk(key)

        raise HTTPException(status_code=401, detail="Invalid token: kid not found")

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation error: {str(e)}")


def verify_cognito_token(token: str) -> Dict:
    """Cognito JWTトークンを検証"""
    try:
        # 署名キーを取得
        signing_key = get_signing_key(token)

        # JWTを検証・デコード
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID,  # トークンのaudience（client_id）を検証
            options={"verify_exp": True},  # 有効期限を検証
        )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_current_user(token: str = Depends(security)) -> Dict[str, str]:
    """現在のユーザー情報を取得"""

    # 開発環境でCognito設定がない場合はモック認証を使用
    if not COGNITO_USER_POOL_ID:
        return {"user_id": "placeholder_user_id", "email": "user@example.com"}

    try:
        # Bearer トークンから実際のトークン部分を抽出
        jwt_token = token.credentials

        # Cognito JWTトークンを検証
        payload = verify_cognito_token(jwt_token)

        # Cognitoのペイロードから必要な情報を抽出
        return {
            "user_id": payload.get("sub"),  # Cognito User ID
            "email": payload.get("email"),
            "username": payload.get("cognito:username", payload.get("email")),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


# オプション：開発用のモック認証（Cognito設定なしでテスト可能）
def get_current_user_optional(token: str = Depends(security)) -> Dict[str, str]:
    """Cognito設定がない場合でも動作するオプショナル認証"""
    if not COGNITO_USER_POOL_ID:
        return {"user_id": "placeholder_user_id", "email": "user@example.com"}

    return get_current_user(token)
