# Use an official Python slim image.
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

ENV BATTLE_HOST=0.0.0.0
ENV BATTLE_PORT=8000
ENV BATTLE_SERVICE_URL=http://localhost:8000
ENV CORS_ORIGINS=http://localhost:5173

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
