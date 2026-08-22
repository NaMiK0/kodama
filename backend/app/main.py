from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import asyncio
from contextlib import asynccontextmanager

from app.core.config import settings

from app.modules.ai.notifications import consume_notifications

from app.modules.auth.router import router as auth_router
from app.modules.decks.router import router as decks_router
from app.modules.library.router import router as library_router
from app.modules.cards.router import router as cards_router
from app.modules.study.router import router as study_router
from app.modules.ai.router import router as ai_router
from app.modules.pronunciation.router import router as pronunciation_router
from app.ws import router as ws_router

import app.models

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(consume_notifications())  # старт при запуске
    try:
        yield
    finally:
        task.cancel()                                    # стоп при выключении
        try:
            await task
        except asyncio.CancelledError:
            pass

app = FastAPI(title="Kodama API", lifespan=lifespan)

# Origin'ы перечисляем ЯВНО: со звёздочкой браузер не пропустит запросы
# с credentials, а куки — это как раз credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,   # без этого браузер не отправит и не примет куку
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router=auth_router)
app.include_router(router=decks_router)
app.include_router(router=library_router)
app.include_router(router=cards_router)
app.include_router(router=study_router)
app.include_router(router=ai_router)
app.include_router(router=pronunciation_router)
app.include_router(router=ws_router)

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
