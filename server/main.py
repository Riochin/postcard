from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import collection, postcards, users

# 環境変数を読み込み
load_dotenv()

app = FastAPI(
    title="Postcard API",
    description="デジタル絵葉書のリレーアプリケーションAPI",
    version="1.0.0",
    servers=[
        {
            "url": "https://postcard-dev-alb-437445372.us-east-1.elb.amazonaws.com",
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
# Temporarily allow all origins for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(users.router)
app.include_router(postcards.router)
app.include_router(collection.router)


@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}
