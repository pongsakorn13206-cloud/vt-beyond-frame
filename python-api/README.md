---
title: VT Beyond Frame - Face API
emoji: 🔍
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
---

# VT Beyond Frame — InsightFace API

AI-powered face detection and embedding extraction API using InsightFace ArcFace (512D).

## Endpoints

- `GET /health` — Check if the API is running
- `POST /detect` — Detect all faces and return embeddings
- `POST /extract` — Extract embedding from the largest face (selfie mode)
