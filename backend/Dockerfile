FROM python:3.11-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    python3-dev \
    bash

# Copy requirements and install dependencies in a virtual environment
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Install only runtime dependencies and update packages
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    postgresql-client \
    curl \
    bash && \
    rm -rf /var/cache/apk/*

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy the rest of the application
COPY . .

# Copy entrypoint script and make it executable
COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh && \
    chown -R appuser:appgroup /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Expose the port
EXPOSE 8000

# Switch to non-root user
USER appuser

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Command to run the application with dynamic port for Heroku
CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
