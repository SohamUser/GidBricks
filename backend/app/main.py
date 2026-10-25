from fastapi import FastAPI

from .api.routes import router

app = FastAPI(
    title="Wind Desk",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)
app.include_router(router)
