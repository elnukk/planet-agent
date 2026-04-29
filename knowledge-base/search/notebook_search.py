import json
from pathlib import Path

from search.metadata_ranker import overlap_score, normalize_text, tokenize


def parse_notebook_cells(notebook_path: str) -> list[dict]:
    with open(notebook_path, "r", encoding="utf-8") as f:
        nb = json.load(f)

    parsed_cells = []

    for i, cell in enumerate(nb.get("cells", [])):
        source = cell.get("source", [])
        if isinstance(source, list):
            content = "".join(source)
        else:
            content = str(source)

        parsed_cells.append(
            {
                "cell_index": i,
                "cell_type": cell.get("cell_type", "unknown"),
                "content": content,
                "outputs": cell.get("outputs", []),
            }
        )

    return parsed_cells


def score_cell_relevance(cell: dict, query: str):
    content = cell.get("content", "")
    if not content.strip():
        return 0.0, None

    stripped = content.strip()

    if stripped.startswith("<!-- PLANET NOTEBOOK METADATA"):
        return 0.0, None

    score = overlap_score(query, content)
    lowered = normalize_text(content)
    query_tokens = set(tokenize(query))

    # Stronger code preference
    if cell.get("cell_type") == "code":
        score += 2.0

    # Query-intent boosts
    if "ndvi" in query_tokens:
        for term in ["ndvi", "nir", "red", "numpy", "np.", "(nir-red)", "normalized difference vegetation index"]:
            if term in lowered:
                score += 1.5

    if "authentication" in query_tokens or "auth" in query_tokens:
        for term in ["api_key", "pl_api_key", "authorization", "session.auth", "requests.session", "headers.update", "auth"]:
            if term in lowered:
                score += 1.5

    if "subscription" in query_tokens or "subscriptions" in query_tokens:
        for term in ["create_subscription", "get_subscription", "subscriptions", "subscription_request", "payload"]:
            if term in lowered:
                score += 1.5

    # Penalize markdown a bit for code-seeking queries
    if cell.get("cell_type") == "markdown" and (
        "code" in normalize_text(query)
        or "calculates" in query_tokens
        or "calls" in query_tokens
    ):
        score -= 1.0

    if score <= 0:
        return 0.0, None

    cell_tokens = set(tokenize(content))
    shared = sorted(query_tokens.intersection(cell_tokens))

    if cell.get("cell_type") == "code":
        reason = "Relevant code cell"
        if shared:
            reason += f"; matches query terms: {', '.join(shared[:6])}"
    else:
        reason = "Relevant explanatory cell"
        if shared:
            reason += f"; matches query terms: {', '.join(shared[:6])}"

    return score, reason


def search_notebook(notebook_path: str, query: str, top_k: int = 3) -> list[dict]:
    notebook_name = Path(notebook_path).name
    cells = parse_notebook_cells(notebook_path)

    results = []

    for cell in cells:
        score, reason = score_cell_relevance(cell, query)
        if reason is None:
            continue

        results.append(
            {
                "notebook": notebook_name,
                "cell_index": cell["cell_index"],
                "cell_type": cell["cell_type"],
                "content": cell["content"].strip(),
                "reason": reason,
                "score": score,
            }
        )

    results.sort(key=lambda x: x["score"], reverse=True)

    return results[:top_k]