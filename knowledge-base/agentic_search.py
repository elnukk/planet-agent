import json
from pathlib import Path

from search.metadata_ranker import rank_notebooks
from search.notebook_search import search_notebook


def load_metadata():
    metadata_path = Path(__file__).parent / "data" / "notebooks_metadata.json"
    with open(metadata_path, "r", encoding="utf-8") as f:
        return json.load(f)


def search_notebooks(query: str):
    base_dir = Path(__file__).parent
    notebooks_dir = base_dir / "notebooks"

    metadata = load_metadata()
    ranked = rank_notebooks(query, metadata, top_k=3)
    selected_notebooks = [filename for filename, _ in ranked]

    all_results = []

    for notebook_filename in selected_notebooks:
        notebook_path = notebooks_dir / notebook_filename

        if not notebook_path.exists():
            continue

        matches = search_notebook(str(notebook_path), query, top_k=3)
        all_results.extend(matches)

    all_results.sort(key=lambda x: x.get("score", 0), reverse=True)

    for r in all_results:
        r.pop("score", None)

    return all_results[:5]


if __name__ == "__main__":
    queries = [
        "find authentication setup code",
        "find a cell that calculates NDVI",
        "find a cell that calls the Subscriptions API",
    ]

    for q in queries:
        print("\n====================")
        print("QUERY:", q)
        results = search_notebooks(q)
        print(json.dumps(results, indent=2))