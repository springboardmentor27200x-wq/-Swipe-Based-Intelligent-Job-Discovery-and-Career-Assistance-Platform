from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Lightweight replacement for sentence-transformers, which needed PyTorch
# and exceeded free-tier hosting memory limits (512MB). TF-IDF has no
# heavy runtime dependency and works well enough for resume/job matching
# on keyword and phrase overlap.

_job_embedding_cache = {}
_resume_embedding_cache = {}
_vectorizer = TfidfVectorizer(stop_words="english", max_features=2000)
_vectorizer_fitted = False
_corpus = []


def _refit_vectorizer():
    global _vectorizer_fitted
    if len(_corpus) >= 2:
        _vectorizer.fit(_corpus)
        _vectorizer_fitted = True


def embed_text(text: str) -> np.ndarray:
    text = text or ""
    _corpus.append(text)
    _refit_vectorizer()
    if not _vectorizer_fitted:
        return np.zeros((1,))
    return _vectorizer.transform([text]).toarray()[0]


def get_job_embedding(job_id, description: str) -> np.ndarray:
    if job_id not in _job_embedding_cache:
        _job_embedding_cache[job_id] = embed_text(description)
    return _job_embedding_cache[job_id]


def get_resume_embedding(resume_id, resume_text: str) -> np.ndarray:
    if resume_id not in _resume_embedding_cache:
        _resume_embedding_cache[resume_id] = embed_text(resume_text)
    return _resume_embedding_cache[resume_id]


def semantic_similarity(embedding_a: np.ndarray, embedding_b: np.ndarray) -> float:
    if embedding_a.shape != embedding_b.shape or embedding_a.sum() == 0 or embedding_b.sum() == 0:
        return 0.0
    sim = cosine_similarity(embedding_a.reshape(1, -1), embedding_b.reshape(1, -1))[0][0]
    return float(np.clip(sim, -1.0, 1.0))

# NOTE: the in-memory caches above reset every time your server restarts.
# That's fine for a course project. For production, store the embedding
# as a JSON/text column on Job and Resume instead, computed once when
# each row is created.