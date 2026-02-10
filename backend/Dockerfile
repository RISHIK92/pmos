FROM python:3.12-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir uv
RUN pip install --no-cache-dir -r requirements.txt

RUN apt-get update && apt-get install -y \
    libatomic1 \
    && rm -rf /var/lib/apt/lists/*

RUN python -m prisma generate

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]