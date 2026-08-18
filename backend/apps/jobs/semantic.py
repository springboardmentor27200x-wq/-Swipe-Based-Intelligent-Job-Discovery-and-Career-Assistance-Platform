"""
SwipeX Semantic Similarity Engine — Milestone 3.1
Adds an AI/embedding-based signal to the recommendation engine, layered on
top of (not replacing) the existing rule-based scoring.

Strategy (in order of preference, with automatic graceful fallback):
  1. sentence-transformers ('all-MiniLM-L6-v2') — real sentence embeddings,
     used automatically if the package is installed AND the model can be
     loaded (first use downloads weights from Hugging Face; requires
     internet access once, then caches locally).
  2. spaCy medium/large English model with word vectors, if installed.
  3. TF-IDF cosine similarity (scikit-learn) — fully offline, no downloads,
     deterministic. This is the default in most environments and is what
     ships "out of the box" via requirements.txt.
  4. Jaccard word-overlap — last-resort, dependency-free fallback so the
     feature never hard-fails even on a bare-bones install.

Every path returns a similarity score normalized to 0.0–1.0.
"""

import re
import threading

_lock = threading.Lock()
_st_model = None
_st_load_attempted = False
_spacy_model = None
_spacy_load_attempted = False


def _try_load_sentence_transformer():
    global _st_model, _st_load_attempted
    if _st_model is not None or _st_load_attempted:
        return _st_model
    with _lock:
        if _st_load_attempted:
            return _st_model
        _st_load_attempted = True
        try:
            from sentence_transformers import SentenceTransformer
            _st_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception:
            _st_model = None
    return _st_model


def _try_load_spacy():
    global _spacy_model, _spacy_load_attempted
    if _spacy_model is not None or _spacy_load_attempted:
        return _spacy_model
    with _lock:
        if _spacy_load_attempted:
            return _spacy_model
        _spacy_load_attempted = True
        try:
            import spacy
            for model_name in ('en_core_web_md', 'en_core_web_lg', 'en_core_web_sm'):
                try:
                    _spacy_model = spacy.load(model_name)
                    break
                except Exception:
                    continue
        except Exception:
            _spacy_model = None
    return _spacy_model


def _cosine(vec_a, vec_b):
    import math
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _tfidf_similarity(text_a: str, text_b: str) -> float:
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        vect = TfidfVectorizer(stop_words='english', max_features=3000)
        matrix = vect.fit_transform([text_a, text_b])
        if matrix.shape[1] == 0:
            return _word_overlap_similarity(text_a, text_b)
        sim = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        return max(0.0, min(1.0, float(sim)))
    except Exception:
        return _word_overlap_similarity(text_a, text_b)


def _word_overlap_similarity(text_a: str, text_b: str) -> float:
    """Dependency-free last-resort fallback: Jaccard similarity over words."""
    words_a = set(re.findall(r"[a-zA-Z]{3,}", text_a.lower()))
    words_b = set(re.findall(r"[a-zA-Z]{3,}", text_b.lower()))
    if not words_a or not words_b:
        return 0.0
    return len(words_a & words_b) / len(words_a | words_b)


def semantic_similarity(text_a: str, text_b: str) -> float:
    """
    Returns a 0.0-1.0 semantic similarity score between two free-text blobs
    (e.g. resume text and a job description). Tries the strongest available
    method first and transparently falls back if it isn't available.
    """
    text_a = (text_a or '').strip()
    text_b = (text_b or '').strip()
    if not text_a or not text_b:
        return 0.0

    # Cap input length for speed/memory — a few paragraphs is plenty of signal.
    text_a = text_a[:4000]
    text_b = text_b[:4000]

    model = _try_load_sentence_transformer()
    if model is not None:
        try:
            embeddings = model.encode([text_a, text_b])
            sim = _cosine(list(embeddings[0]), list(embeddings[1]))
            return max(0.0, min(1.0, (sim + 1) / 2))  # cosine in [-1,1] -> [0,1]
        except Exception:
            pass

    nlp = _try_load_spacy()
    if nlp is not None:
        try:
            doc_a, doc_b = nlp(text_a), nlp(text_b)
            if doc_a.vector_norm and doc_b.vector_norm:
                sim = doc_a.similarity(doc_b)
                return max(0.0, min(1.0, (sim + 1) / 2))
        except Exception:
            pass

    return _tfidf_similarity(text_a, text_b)


def active_backend() -> str:
    """Which similarity backend is currently active — useful for diagnostics/UI."""
    if _st_model is not None:
        return 'sentence-transformers (all-MiniLM-L6-v2)'
    if _spacy_model is not None:
        return 'spaCy'
    return 'tfidf'
