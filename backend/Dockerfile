FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Build context is repo root — paths below are relative to it
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app /app/app

# Bake JSON snapshot files into the image so the API has fallback data
# even without a volume mount (required for Hostinger Docker Manager)
COPY frontend/public /app/frontend/public

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
