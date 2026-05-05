FROM python:3.10-slim

# Install system dependencies (ffmpeg is required for yt-dlp and whisper)
RUN apt-get update && \
    apt-get install -y ffmpeg git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user (Required by Hugging Face Spaces)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /home/user/app

# Copy requirements and install
COPY --chown=user:user requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Copy backend code
COPY --chown=user:user . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose the Hugging Face port
ENV PORT=7860
EXPOSE $PORT

# Start FastAPI
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
