from fastapi import FastAPI

from app.modules.auth.router import router as auth_router
from app.modules.decks.router import router as decks_router

import app.models

app = FastAPI(title="Kodama API")


app.include_router(router=auth_router)
app.include_router(router=decks_router)

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
