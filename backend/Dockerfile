FROM python:3.12-slim

# uv — тот же менеджер зависимостей, что и локально
COPY --from=ghcr.io/astral-sh/uv:0.11.31 /uv /usr/local/bin/uv

# ffmpeg — декодирование аудио перед подачей в Whisper
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    # Кеш ML-моделей — в отдельной папке под volume, чтобы переживал пересборку
    XDG_CACHE_HOME=/cache \
    HF_HOME=/cache/huggingface \
    PATH="/app/.venv/bin:$PATH"

# Пользователя создаём ДО установки зависимостей. Если сделать chown -R после,
# Docker скопирует весь слой заново (смена владельца = изменение каждого файла)
# и образ раздуется вдвое. Здесь chown отрабатывает на пустых папках.
RUN useradd --create-home --uid 1000 kodama \
    && mkdir -p /app/uploads /cache \
    && chown -R kodama:kodama /app /cache

USER kodama
WORKDIR /app

# СНАЧАЛА только манифесты зависимостей: слой с установкой пакетов
# закешируется и не будет пересобираться при каждой правке кода.
COPY --chown=kodama:kodama pyproject.toml uv.lock ./
# cache-mount: кеш скачанных пакетов живёт ВНЕ образа (иначе +1.1 ГБ мёртвого
# груза внутри), но переиспользуется между сборками — они остаются быстрыми.
RUN --mount=type=cache,target=/cache/uv,uid=1000,gid=1000 \
    uv sync --frozen --no-dev

# И только ПОТОМ исходники — они меняются часто, но переустановки не вызывают.
COPY --chown=kodama:kodama . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
