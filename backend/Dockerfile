FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for mysqlclient & psycopg2
RUN apt-get update && apt-get install -y \
    pkg-config \
    default-libmysqlclient-dev \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /app

EXPOSE 8000

CMD python manage.py migrate && \
    gunicorn text2sql.wsgi:application --bind 0.0.0.0:$PORT
