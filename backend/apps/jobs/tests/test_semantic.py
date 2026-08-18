"""Tests for apps.jobs.semantic — the AI-enhanced similarity component (Milestone 3.1)."""

from apps.jobs.semantic import semantic_similarity


class TestSemanticSimilarity:
    def test_similar_texts_score_higher_than_dissimilar(self, db):
        resume_text = 'Experienced Python Django backend developer with REST API and PostgreSQL skills.'
        matching_job = 'Looking for a backend engineer skilled in Python, Django, REST APIs, and databases.'
        unrelated_job = 'Looking for a professional chef with 5 years experience in Italian cuisine.'

        sim_matching = semantic_similarity(resume_text, matching_job)
        sim_unrelated = semantic_similarity(resume_text, unrelated_job)

        assert 0.0 <= sim_matching <= 1.0
        assert 0.0 <= sim_unrelated <= 1.0
        assert sim_matching > sim_unrelated

    def test_empty_inputs_return_zero(self, db):
        assert semantic_similarity('', 'something') == 0.0
        assert semantic_similarity('something', '') == 0.0
        assert semantic_similarity('', '') == 0.0

    def test_identical_text_scores_high(self, db):
        text = 'Full stack developer with React, Django, and PostgreSQL experience.'
        assert semantic_similarity(text, text) > 0.9
