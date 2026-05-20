"""
InsightFace API Server
High-accuracy face detection and embedding extraction using ArcFace (w600k_r50) model.
Uses SCRFD for detection and ArcFace for 512D embedding.
"""
import io
import os
import logging
import numpy as np
import cv2
from PIL import Image
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
from insightface.model_zoo import SCRFD, ArcFaceONNX
from insightface.utils.face_align import norm_crop

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="InsightFace API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global models
detector = None
recognizer = None

MODEL_DIR = os.path.expanduser("~/.insightface/models/buffalo_l")


def load_models():
    """Load SCRFD (detection) and ArcFace (recognition) models."""
    global detector, recognizer

    if detector is None:
        det_path = os.path.join(MODEL_DIR, "det_10g.onnx")
        logger.info(f"Loading SCRFD detector from {det_path}")
        detector = SCRFD(det_path)
        detector.prepare(-1)
        logger.info("SCRFD detector loaded!")

    if recognizer is None:
        rec_path = os.path.join(MODEL_DIR, "w600k_r50.onnx")
        logger.info(f"Loading ArcFace recognizer from {rec_path}")
        recognizer = ArcFaceONNX(rec_path)
        recognizer.prepare(-1)
        logger.info("ArcFace recognizer loaded!")

    return detector, recognizer


def read_image_from_bytes(file_bytes: bytes) -> np.ndarray:
    """Convert uploaded file bytes to OpenCV BGR image."""
    pil_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")

    max_size = 1920
    w, h = pil_image.size
    if max(w, h) > max_size:
        scale = max_size / max(w, h)
        pil_image = pil_image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    img_array = np.array(pil_image)
    return cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)


def detect_and_embed(img: np.ndarray):
    """Detect faces and extract 512D ArcFace embeddings."""
    det, rec = load_models()

    # Detect faces — returns bboxes and keypoints
    bboxes, kpss = det.detect(img, input_size=(640, 640))

    results = []
    h, w = img.shape[:2]

    for i in range(bboxes.shape[0]):
        bbox = bboxes[i, :4]
        score = float(bboxes[i, 4])

        if score < 0.5:
            continue

        kps = kpss[i] if kpss is not None else None

        # Align and crop face using keypoints
        if kps is not None:
            aligned_face = norm_crop(img, kps)
        else:
            # Fallback: simple crop
            x1, y1, x2, y2 = [int(v) for v in bbox]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            aligned_face = cv2.resize(img[y1:y2, x1:x2], (112, 112))

        # Extract 512D embedding using get_feat (v0.2.x API)
        embedding = rec.get_feat(aligned_face)
        # get_feat returns (1, 512) shape, flatten it
        if len(embedding.shape) > 1:
            embedding = embedding.flatten()

        # Normalize to unit vector
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        results.append({
            "embedding": embedding.tolist(),
            "box": {
                "x": float(bbox[0]) / w,
                "y": float(bbox[1]) / h,
                "width": float(bbox[2] - bbox[0]) / w,
                "height": float(bbox[3] - bbox[1]) / h,
            },
            "confidence": score,
        })

    return results


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "detector_loaded": detector is not None,
        "recognizer_loaded": recognizer is not None,
    }


@app.post("/detect")
async def detect_faces_endpoint(image: UploadFile = File(...)):
    """Detect all faces in an image and return embeddings (512D)."""
    try:
        file_bytes = await image.read()
        img = read_image_from_bytes(file_bytes)
        faces = detect_and_embed(img)

        logger.info(f"Detected {len(faces)} face(s)")
        return JSONResponse(content={"faces": faces, "count": len(faces)})

    except Exception as e:
        logger.error(f"Error detecting faces: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract")
async def extract_single_face(image: UploadFile = File(...)):
    """Extract embedding from selfie (largest face)."""
    try:
        file_bytes = await image.read()
        img = read_image_from_bytes(file_bytes)
        faces = detect_and_embed(img)

        if not faces:
            return JSONResponse(
                status_code=400,
                content={"error": "ไม่พบใบหน้าในรูป กรุณาลองใหม่ด้วยรูปที่เห็นหน้าชัดเจน"},
            )

        # Pick the largest face
        largest = max(faces, key=lambda f: f["box"]["width"] * f["box"]["height"])

        logger.info(f"Extracted face, dim={len(largest['embedding'])}, score={largest['confidence']:.3f}")
        return JSONResponse(content={
            "embedding": largest["embedding"],
            "confidence": largest["confidence"],
            "faces_found": len(faces),
            "embedding_dim": len(largest["embedding"]),
        })

    except Exception as e:
        logger.error(f"Error extracting face: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.on_event("startup")
async def startup_event():
    logger.info("Pre-loading InsightFace models...")
    try:
        load_models()
        logger.info("Server ready!")
    except Exception as e:
        logger.error(f"Failed to pre-load: {e}", exc_info=True)
        logger.info("Models will load on first request")


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
