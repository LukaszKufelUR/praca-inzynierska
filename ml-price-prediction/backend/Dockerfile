# Stage 1: Builder - instalacja zależności
FROM python:3.10-slim as builder

WORKDIR /app

# Instalacja tylko niezbędnych narzędzi budowania
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Kopiowanie requirements
COPY requirements.txt .

# Instalacja PyTorch CPU-only (zamiast wersji z CUDA - oszczędność ~2.5GB)
RUN pip install --no-cache-dir --user \
    torch==2.0.0+cpu \
    -f https://download.pytorch.org/whl/torch_stable.html

# Instalacja pozostałych pakietów
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime - minimalny obraz produkcyjny
FROM python:3.10-slim

WORKDIR /app

# Instalacja tylko runtime dependencies (bez build-essential)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Kopiowanie zainstalowanych pakietów z buildera
COPY --from=builder /root/.local /root/.local

# Kopiowanie kodu aplikacji
COPY . .

# Upewnienie się, że pip packages są w PATH
ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
