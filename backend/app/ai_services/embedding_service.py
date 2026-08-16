from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

_MODEL = SentenceTransformer("all-MiniLM-L6-v2")

# Simple in-memory caches keyed by DB row id, so we don't re-embed the
# same resume/job text on every request. Swap for a DB column or Redis
# once you're past prototyping -- see the note at the bottom of this file.
_job_embedding_cache = {}
_resume_embedding_cache = {}


def embed_text(text: str) -> np.ndarray:
    return _MODEL.encode(text or "", normalize_embeddings=True)


def get_job_embedding(job_id, description: str) -> np.ndarray:
    if job_id not in _job_embedding_cache:
        _job_embedding_cache[job_id] = embed_text(description)
    return _job_embedding_cache[job_id]


def get_resume_embedding(resume_id, resume_text: str) -> np.ndarray:
    if resume_id not in _resume_embedding_cache:
        _resume_embedding_cache[resume_id] = embed_text(resume_text)
    return _resume_embedding_cache[resume_id]


def semantic_similarity(embedding_a: np.ndarray, embedding_b: np.ndarray) -> float:
    sim = cosine_similarity(embedding_a.reshape(1, -1), embedding_b.reshape(1, -1))[0][0]
    return float(np.clip(sim, -1.0, 1.0))

# NOTE: the in-memory caches above reset every time your server restarts.
# That's fine for a course project. For production, store the embedding
# as a JSON/text column on Job and Resume instead, computed once when
# each row is created.