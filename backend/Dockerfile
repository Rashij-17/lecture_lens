FROM python:3.10-slim

# Install system dependencies (ffmpeg is required for yt-dlp and whisper)
RUN apt-get update && \
    apt-get install -y ffmpeg git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose the port (Render uses the PORT env var, defaults to 8000 here)
ENV PORT=8000
EXPOSE $PORT

# Start FastAPI
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
