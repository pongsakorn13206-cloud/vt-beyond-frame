FROM python:3.10

# System deps for OpenCV and wget/unzip
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0t64 \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download InsightFace models (buffalo_l) directly from GitHub releases
RUN mkdir -p /root/.insightface/models/buffalo_l && \
    wget -q -O buffalo_l.zip "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" && \
    unzip -q buffalo_l.zip -d /root/.insightface/models/buffalo_l && \
    rm buffalo_l.zip

# Copy app code
COPY server.py .

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860

# Run the server on port 7860
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
