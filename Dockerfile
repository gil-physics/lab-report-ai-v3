# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Setup Backend and Serve Frontend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY api/requirements.txt ./api/
RUN pip install --no-cache-dir -r api/requirements.txt

# Copy backend code
COPY api/ ./api/

# Copy built frontend from Stage 1 to backend's static directory
COPY --from=frontend-builder /app/frontend/dist ./api/static

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Run the unified server
# Using shell form to allow environment variable expansion
CMD uvicorn api.main:app --host 0.0.0.0 --port $PORT
