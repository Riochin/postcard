from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import collection, postcards, users

app = FastAPI(
    title="Postcard API",
    description="デジタル絵葉書のリレーアプリケーションAPI",
    version="1.0.0",
    servers=[
        {
            "url": "http://postcard-dev-alb-437445372.us-east-1.elb.amazonaws.com",
            "description": "AWS ALB Development Environment",
        },
        {"url": "http://localhost:8000", "description": "Local Development Server"},
    ],
    openapi_tags=[
        {"name": "users", "description": "ユーザー関連の操作"},
        {"name": "postcards", "description": "絵葉書関連の操作"},
        {"name": "travel", "description": "旅の軌跡関連の操作"},
        {"name": "tracking", "description": "リアルタイム追跡・取得関連の操作"},
        {"name": "collection", "description": "コレクション・いいね関連の操作"},
    ],
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js development
        "https://localhost:3000",  # Next.js development (HTTPS)
        "http://127.0.0.1:3000",  # Alternative localhost
        "http://localhost:8000",  # FastAPI Swagger UI
        "http://127.0.0.1:8000",  # FastAPI Swagger UI alternative
        "https://main.doyow5whm2yhd.amplifyapp.com/",
        "http://postcard-dev-alb-437445372.us-east-1.elb.amazonaws.com",  # ←追加
        "https://postcard-dev-alb-437445372.us-east-1.elb.amazonaws.com",  # ←httpsも必要なら
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(postcards.router)
app.include_router(collection.router)


@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}
