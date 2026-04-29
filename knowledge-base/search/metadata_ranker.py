import re

STOPWORDS = {
    "a", "an", "the", "that", "this", "these", "those",
    "find", "cell", "code", "calls", "call", "using",
    "with", "for", "and", "or", "to", "of", "in", "on",
    "api"
}


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9_\-/\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize(text: str) -> list[str]:
    tokens = normalize_text(text).split()
    return [t for t in tokens if t not in STOPWORDS and len(t) > 1]


def overlap_score(query: str, text: str) -> float:
    query_tokens = tokenize(query)
    text_tokens = tokenize(text)

    if not query_tokens or not text_tokens:
        return 0.0

    text_set = set(text_tokens)
    score = 0.0

    for token in query_tokens:
        if token in text_set:
            score += 1.0

    norm_query = " ".join(query_tokens)
    norm_text = " ".join(text_tokens)
    if norm_query and norm_query in norm_text:
        score += 2.0

    return score


def weighted_metadata_score(query: str, filename: str, entry: dict) -> float:
    score = 0.0
    score += 2.0 * overlap_score(query, entry.get("description", ""))
    score += 1.5 * overlap_score(query, " ".join(entry.get("apis_used", [])))
    score += 1.2 * overlap_score(query, entry.get("planet_product", ""))
    score += 1.0 * overlap_score(query, entry.get("use_case", ""))
    score += 0.5 * overlap_score(query, filename)
    return score


def rank_notebooks(query: str, metadata: dict, top_k: int = 3) -> list[tuple[str, float]]:
    scored = []

    for filename, entry in metadata.items():
        if not isinstance(entry, dict):
            continue
        score = weighted_metadata_score(query, filename, entry)
        scored.append((filename, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]