from fastapi import FastAPI

from app.modules.auth.router import router as auth_router
from app.modules.decks.router import router as decks_router
from app.modules.cards.router import router as cards_router
from app.modules.study.router import router as study_router
from app.modules.ai.router import router as ai_router

import app.models

app = FastAPI(title="Kodama API")


app.include_router(router=auth_router)
app.include_router(router=decks_router)
app.include_router(router=cards_router)
app.include_router(router=study_router)
app.include_router(router=ai_router)

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
