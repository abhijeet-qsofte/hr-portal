#!/bin/sh
set -e

# Add the current directory to PYTHONPATH
export PYTHONPATH=/app:$PYTHONPATH

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  sleep 1
done
echo "PostgreSQL is up and running!"

# Run migrations
echo "Running database migrations..."
cd /app && alembic upgrade head

# Initialize database with test data if in development mode
if [ "$ENVIRONMENT" = "development" ]; then
  echo "Initializing database with test data..."
  python /app/setup.py --reset
fi

# Start the application
echo "Starting the application..."
exec "$@"
