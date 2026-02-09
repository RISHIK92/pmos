#!/bin/sh

# 1. Apply migrations to the DB (use 'deploy' for production, not 'dev')
echo "Applying database migrations..."
python -m prisma migrate deploy

# 2. Start the application
echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000