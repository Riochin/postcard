from fastapi import FastAPI

from routers import collection, postcards, users

app = FastAPI(
    title="Postcard API",
    description="デジタル絵葉書のリレーアプリケーションAPI",
    version="1.0.0",
    openapi_tags=[
        {"name": "users", "description": "ユーザー関連の操作"},
        {"name": "postcards", "description": "絵葉書関連の操作"},
        {"name": "travel", "description": "旅の軌跡関連の操作"},
        {"name": "tracking", "description": "リアルタイム追跡・取得関連の操作"},
        {"name": "collection", "description": "コレクション・いいね関連の操作"},
    ],
)

# Include routers
app.include_router(users.router)
app.include_router(postcards.router)
app.include_router(collection.router)


@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}
