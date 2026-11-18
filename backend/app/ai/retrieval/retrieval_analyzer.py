

from dataclasses import dataclass
from typing import Literal
import re

from langchain_core.documents import Document


Confidence = Literal["high", "uncertain", "insufficient"]


@dataclass
class RetrievalAnalysis:
    confidence: Confidence
    needs_llm_fallback: bool
    selected_documents: list[Document]
    signals: dict


STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were",
    "what", "when", "where", "who", "why", "how",
    "much", "many", "does", "did", "do", "can", "could",
    "would", "should", "will", "has", "have", "had",
    "from", "through", "to", "of", "in", "on", "for",
    "with", "and", "or", "this", "that", "these", "those",
    "company", "document", "information", "please",
}


# These phrases indicate that a relevant chunk may not support
# the requested fact, or that its data may not be authoritative.
# They trigger evidence validation, not automatic rejection.
MISSING_EVIDENCE_PATTERNS = [
    r"\bnot provided\b",
    r"\bnot specified\b",
    r"\bnot stated\b",
    r"\bnot available\b",
    r"\bdoes not state\b",
    r"\bdo not state\b",
    r"\bnot included\b",
    r"\bno data available\b",
    r"\binsufficient information\b",
    r"\bcannot be determined\b",
    r"\bunable to determine\b",
    r"\bnot mentioned\b",
    r"\bnot reported\b",
]

NON_AUTHORITATIVE_DATA_PATTERNS = [
    r"\bsynthetic data\b",
    r"\bsynthetic dataset\b",
    r"\bsimulated data\b",
    r"\billustrative data\b",
    r"\bgenerated for testing\b",
    r"\btest data\b",
]


def _normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _query_terms(text: str) -> set[str]:
    normalized = _normalize_text(text)
    return {
        word
        for word in normalized.split()
        if len(word) > 2 and word not in STOP_WORDS
    }


def _term_coverage(
    question: str,
    search_query: str,
    documents: list[Document],
) -> dict:
    question_terms = _query_terms(question)
    search_terms = _query_terms(search_query)
    query_terms = question_terms | search_terms

    if not query_terms:
        return {
            "query_term_count": 0,
            "covered_term_count": 0,
            "coverage_ratio": 0.0,
            "covered_terms": [],
            "missing_terms": [],
        }

    evidence_terms = set()
    for document in documents:
        evidence_terms.update(_query_terms(document.page_content))

    covered_terms = sorted(
        term for term in query_terms if term in evidence_terms
    )
    missing_terms = sorted(
        term for term in query_terms if term not in evidence_terms
    )

    return {
        "query_term_count": len(query_terms),
        "covered_term_count": len(covered_terms),
        "coverage_ratio": round(
            len(covered_terms) / len(query_terms), 3
        ),
        "covered_terms": covered_terms,
        "missing_terms": missing_terms,
    }


def _important_terms(question: str) -> set[str]:
    return _query_terms(question)


def _important_term_document_coverage(
    question: str,
    documents: list[Document],
) -> dict:
    important_terms = _important_terms(question)

    if not important_terms:
        return {
            "important_term_count": 0,
            "fully_supported": True,
            "unsupported_terms": [],
            "term_document_counts": {},
        }

    term_document_counts = {}

    for term in important_terms:
        count = sum(
            term in _query_terms(document.page_content)
            for document in documents
        )
        term_document_counts[term] = count

    unsupported_terms = sorted(
        term
        for term, count in term_document_counts.items()
        if count == 0
    )

    return {
        "important_term_count": len(important_terms),
        "fully_supported": not unsupported_terms,
        "unsupported_terms": unsupported_terms,
        "term_document_counts": term_document_counts,
    }


def _detect_multi_part_question(question: str) -> bool:
    normalized = _normalize_text(question)

    multi_part_patterns = [
        r"\bcompare\b",
        r"\bcomparison\b",
        r"\bdifference\b",
        r"\bdifferences\b",
        r"\bbetween\b",
        r"\bfrom\b.*\bto\b",
        r"\bfrom\b.*\bthrough\b",
        r"\bversus\b",
        r"\bvs\b",
        r"\band\b",
    ]

    return any(
        re.search(pattern, normalized)
        for pattern in multi_part_patterns
    )


def _document_quality_signals(
    documents: list[Document],
) -> dict:
    scores = [
        float(document.metadata.get("rerank_score", 0.0))
        for document in documents
    ]

    strong_documents = [
        document
        for document in documents
        if float(document.metadata.get("rerank_score", 0.0)) >= 2.0
    ]

    normalized_contents = [
        _normalize_text(document.page_content)
        for document in documents
    ]

    top_score = max(scores) if scores else 0.0
    score_gap = scores[0] - scores[1] if len(scores) >= 2 else None

    return {
        "document_count": len(documents),
        "strong_document_count": len(strong_documents),
        "top_score": round(top_score, 4),
        "score_gap_top_two": (
            round(score_gap, 4) if score_gap is not None else None
        ),
        "duplicate_count": (
            len(documents) - len(set(normalized_contents))
        ),
        "unique_document_count": len(set(normalized_contents)),
    }


def _evidence_warning_signals(
    documents: list[Document],
) -> dict:
    """
    Detect warning language in relevant chunks.

    These signals do not prove that an answer is unavailable.
    They prevent the high-confidence shortcut and send the
    candidate evidence to the evaluator.
    """
    candidates = [
        document
        for document in documents
        if float(document.metadata.get("rerank_score", 0.0)) >= 2.0
    ]

    # If no chunk meets the strong-score threshold, inspect all
    # retrieved chunks rather than silently ignoring the evidence.
    if not candidates:
        candidates = documents

    missing_evidence_indexes = []
    non_authoritative_indexes = []

    for index, document in enumerate(candidates):
        content = document.page_content.lower()

        if any(
            re.search(pattern, content)
            for pattern in MISSING_EVIDENCE_PATTERNS
        ):
            missing_evidence_indexes.append(index)

        if any(
            re.search(pattern, content)
            for pattern in NON_AUTHORITATIVE_DATA_PATTERNS
        ):
            non_authoritative_indexes.append(index)

    return {
        "missing_evidence_warning": bool(missing_evidence_indexes),
        "missing_evidence_warning_indexes": missing_evidence_indexes,
        "non_authoritative_data_warning": bool(non_authoritative_indexes),
        "non_authoritative_data_warning_indexes": non_authoritative_indexes,
    }


def analyze_retrieval(
    question: str,
    search_query: str,
    documents: list[Document],
) -> RetrievalAnalysis:
    if not documents:
        return RetrievalAnalysis(
            confidence="insufficient",
            needs_llm_fallback=False,
            selected_documents=[],
            signals={
                "question": question,
                "search_query": search_query,
                "document_count": 0,
                "reason": "No documents were retrieved.",
            },
        )

    quality = _document_quality_signals(documents)

    coverage = _term_coverage(
        question=question,
        search_query=search_query,
        documents=documents,
    )

    important_coverage = _important_term_document_coverage(
        question=question,
        documents=documents,
    )

    warning_signals = _evidence_warning_signals(documents)
    is_multi_part = _detect_multi_part_question(question)

    top_score = quality["top_score"]
    strong_count = quality["strong_document_count"]
    coverage_ratio = coverage["coverage_ratio"]

    signals = {
        "question": question,
        "search_query": search_query,
        **quality,
        **coverage,
        **important_coverage,
        **warning_signals,
        "multi_part_question": is_multi_part,
    }

    # Relevant chunks containing explicit missing-information
    # statements or non-authoritative data must be validated.
    # Do not classify them as high just because their scores are high.
    has_evidence_warning = (
        warning_signals["missing_evidence_warning"]
        or warning_signals["non_authoritative_data_warning"]
    )

    if has_evidence_warning:
        selected_documents = [
            document
            for document in documents
            if float(document.metadata.get("rerank_score", 0.0)) >= 2.0
        ]

        if not selected_documents:
            selected_documents = documents

        return RetrievalAnalysis(
            confidence="uncertain",
            needs_llm_fallback=True,
            selected_documents=selected_documents,
            signals={
                **signals,
                "reason": (
                    "Relevant evidence contains missing-information "
                    "or non-authoritative-data warning signals; "
                    "evidence validation is required."
                ),
            },
        )

    # Multi-part questions require evidence for every part.
    if is_multi_part:
        selected_documents = [
            document
            for document in documents
            if float(document.metadata.get("rerank_score", 0.0)) >= 2.0
        ]

        if not selected_documents:
            selected_documents = documents

        return RetrievalAnalysis(
            confidence="uncertain",
            needs_llm_fallback=True,
            selected_documents=selected_documents,
            signals={
                **signals,
                "reason": (
                    "Multi-part question requires "
                    "evidence-level validation."
                ),
            },
        )

    # Weak retrieval for a simple question.
    if top_score < 1.5:
        return RetrievalAnalysis(
            confidence="insufficient",
            needs_llm_fallback=False,
            selected_documents=[],
            signals={
                **signals,
                "reason": "Retrieval strength is too weak.",
            },
        )

    # Relevance and lexical coverage are necessary safeguards,
    # but they are not independently proof of factual support.
    if (
        top_score >= 3.0
        and strong_count >= 1
        and coverage_ratio >= 0.7
        and important_coverage["fully_supported"]
    ):
        selected_documents = [
            document
            for document in documents
            if float(document.metadata.get("rerank_score", 0.0)) >= 2.0
        ]

        return RetrievalAnalysis(
            confidence="high",
            needs_llm_fallback=False,
            selected_documents=selected_documents,
            signals={
                **signals,
                "reason": (
                    "Strong retrieval and lexical coverage, "
                    "with no detected evidence-warning signals. "
                    "This is a heuristic, not a factual guarantee."
                ),
            },
        )

    # Ambiguous retrieval goes to the evidence evaluator.
    selected_documents = [
        document
        for document in documents
        if float(document.metadata.get("rerank_score", 0.0)) >= 2.0
    ]

    if not selected_documents:
        selected_documents = documents

    return RetrievalAnalysis(
        confidence="uncertain",
        needs_llm_fallback=True,
        selected_documents=selected_documents,
        signals={
            **signals,
            "reason": (
                "Retrieved evidence may be relevant, "
                "but deterministic confidence is insufficient."
            ),
        },
    )
