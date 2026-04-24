# agentic_search.py
# M1 - Vanesska
#
# PURPOSE: Given a workflow step description, search through the cloned
# Planet notebooks at the cell level and return the most relevant
# functional units.
#
# INPUT: a natural language query string
#        e.g. "find a cell that calculates NDVI"
#             "find authentication setup code"
#             "find a cell that calls the Subscriptions API"
#
# OUTPUT: a list of dicts with:
#   [
#     {
#       "notebook": "bare_soil_detector.ipynb",
#       "cell_index": 4,
#       "cell_type": "code",
#       "content": "the actual cell content",
#       "reason": "why this cell is relevant to the query"
#     },
#     ...
#   ]
#
# CONNECTS TO: lib/agent/retriever.ts calls this at workflow planning time
#              alongside web_search.py — both run in parallel per step
#
# STUDENT NOTE:
# This file should stay focused on notebook search only.
# The DSPy agent will call one main function from here, so the goal is to
# finish a clean `search_notebooks(query)` pipeline and keep the return shape
# consistent with the OUTPUT schema above.
#
# WHAT STILL NEEDS TO HAPPEN HERE:
# 1. Read notebook metadata from `knowledge-base/data/notebooks_metadata.json`.
# 2. Narrow the search to a small shortlist of notebooks before opening cells.
# 3. Parse notebook JSON and extract useful cell-level content.
# 4. Score cells for relevance to the query.
# 5. Return the top matches with short reasons the agent can reuse.
#
# IMPORTANT:
# Try to keep helper functions in this file. The agent layer should not need
# to know notebook internals; it should just call this module as a tool.

# HOW IT WORKS:
# STEP 1 — Coarse selection
#   Read notebooks_metadata.json and use an LLM call to identify
#   the 2-3 most relevant notebooks for the given query.
#   Don't search all 15 notebooks every time — narrow first.
#
# STEP 2 — Cell-level search
#   Parse the shortlisted .ipynb files (they are just JSON).
#   For each cell, use an LLM call to score relevance to the query.
#   Return the top matching cells with their metadata.
#
# NOTE ON .ipynb FORMAT:
#   Notebooks are JSON files. Each cell looks like:
#   {
#     "cell_type": "code" or "markdown",
#     "source": ["line 1\n", "line 2\n"],  <- list of strings, join them
#     "outputs": [...]                      <- include these, they have context
#   }
#   Load with: import json; nb = json.load(open("notebook.ipynb"))
#   Cells are at: nb["cells"]

# TODO:
# def load_metadata() -> dict:
#     # reads notebooks_metadata.json
#     pass

# def select_relevant_notebooks(query: str, metadata: dict) -> list[str]:
#     # LLM call: given query + metadata, return 2-3 notebook filenames
#     pass

# def parse_notebook_cells(notebook_path: str) -> list[dict]:
#     # load .ipynb as JSON, extract cells with their index and type
#     pass

# def score_cell_relevance(cell: dict, query: str) -> str:
#     # LLM call: given a cell and a query, return relevance reasoning
#     # or None if not relevant
#     pass

# def search_notebooks(query: str) -> list[dict]:
#     """
#     
#     """
#     # main function — runs the full pipeline:
#     # load_metadata -> select_relevant_notebooks -> parse_notebook_cells
#     # -> score_cell_relevance -> return top matches
#     pass
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