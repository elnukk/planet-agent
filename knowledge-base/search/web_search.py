# web_search.py
# M1 - Anya
# 
# PURPOSE: Given a workflow step description, search docs.planet.com live
# and return the relevant content + source URL.
# 
# INPUT: a natural language query string
#        e.g. "what are the rate limits for the Orders API"
#             "what bands does PlanetScope have"
#             "how do I authenticate with the Data API"
#
# OUTPUT: a dict with:
#   {
#     "content": "the relevant text extracted from the page",
#     "source_url": "https://docs.planet.com/develop/apis/orders/",
#     "section": "Rate Limiting"
#   }
#
# CONNECTS TO: lib/agent/retriever.ts calls this at workflow planning time
#
# This file should stay focused on live Planet docs lookup.
# The DSPy agent should only need one stable function from here:
# `search_planet_docs(query)`.
#
# HOW IT WORKS:
# 1. Take the query string
# 2. Use a web search API (Tavily or Google Search API, or https://serpapi.com/search-api) to search docs.planet.com
# 3. Fetch the top result page
# 4. Extract the relevant section using BeautifulSoup + markdownify
# 5. Return content + source URL


# TODO:
# def search_planet_docs(query: str) -> dict:
#     pass

# def fetch_page_content(url: str) -> str:
#     pass

# def extract_relevant_section(content: str, query: str) -> str:
#     pass


import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md
import os
from dotenv import load_dotenv

load_dotenv()  # automatically reads .env in current directory

def get_serpapi_key():
    key = os.getenv("SERPAPI_KEY")
    if not key:
        raise ValueError("SERPAPI_KEY not found in environment")
    return key

SERP_API_URL = "https://serpapi.com/search"


def search_planet_docs(query: str, api_key: str = None) -> dict:
    """
    
    """

    if api_key is None:
        api_key = get_serpapi_key()

    # Force domain restriction to Planet docs
    refined_query = f"site:docs.planet.com {query}"

    params = {
        "engine": "google",
        "q": refined_query,
        "api_key": api_key,
        "num": 3
    }

    response = requests.get(SERP_API_URL, params=params)
    if response.status_code != 200:
        raise Exception(f"SerpAPI error: {response.text}")

    data = response.json()
    organic = data.get("organic_results", [])

    if not organic:
        return {
            "content": "",
            "source_url": "",
            "section": ""
        }

    top_result = organic[0]
    url = top_result.get("link")

    page_html = fetch_page_content(url)
    content_md = html_to_markdown(page_html)

    section = extract_relevant_section(content_md, query)

    return {
        "content": section,
        "source_url": url,
        "section": top_result.get("title", "")
    }


def fetch_page_content(url: str) -> str:
    """
    
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Workflow-Agent)"
    }

    response = requests.get(url, headers=headers, timeout=10)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch page: {url}")

    return response.text


def html_to_markdown(html: str) -> str:
    """
    
    """
    soup = BeautifulSoup(html, "html.parser")

    # Remove noisy elements
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    clean_html = str(soup)
    return md(clean_html)


# def extract_relevant_section(content: str, query: str) -> str:
#     """
#     Naive but effective keyword-based section extraction.

#     Since we are NOT using embeddings (by design), we:
#     - split into chunks by headers
#     - score chunks by keyword overlap
#     """

#     query_terms = set(query.lower().split())

#     sections = content.split("\n#")  # rough header split

#     best_section = ""
#     best_score = 0

#     for section in sections:
#         lower = section.lower()

#         score = sum(1 for term in query_terms if term in lower)

#         if score > best_score:
#             best_score = score
#             best_section = section

#     return best_section.strip()
def extract_relevant_section(content: str, query: str) -> str:
    """
    
    """
    query_terms = set(query.lower().split())

    sections = content.split("\n## ")

    best_section = ""
    best_score = 0

    for section in sections:
        lower = section.lower()

        # keyword match
        keyword_score = sum(1 for term in query_terms if term in lower)

        # bonus: reward API-related keywords
        api_boost = 0
        if "api" in lower or "auth" in lower or "token" in lower:
            api_boost = 2

        score = keyword_score + api_boost

        if score > best_score:
            best_score = score
            best_section = section

    return best_section.strip()


# Full workflow wrapper
def search_planet_docs(query: str, api_key: str = None) -> dict:
    """
    MAIN WRAPPER FUNCTION

    End-to-end pipeline:
    1. Load API key
    2. Search docs.planet.com via SerpAPI
    3. Fetch top result page
    4. Convert HTML → markdown
    5. Extract most relevant section
    6. Return structured result
    """

    # --- Step 0: Load API key ---
    if api_key is None:
        api_key = get_serpapi_key()

    # --- Step 1: Search ---
    refined_query = f"site:docs.planet.com {query}"

    params = {
        "engine": "google",
        "q": refined_query,
        "api_key": api_key,
        "num": 3
    }

    response = requests.get(SERP_API_URL, params=params, timeout=10)
    if response.status_code != 200:
        raise Exception(f"SerpAPI error: {response.text}")

    data = response.json()
    organic = data.get("organic_results", [])

    if not organic:
        return {
            "content": "",
            "source_url": "",
            "section": ""
        }

    # --- Step 2: Select top result ---
    top_result = organic[0]
    url = top_result.get("link")
    title = top_result.get("title", "")

    # --- Step 3: Fetch page ---
    page_html = fetch_page_content(url)

    # --- Step 4: Convert to markdown ---
    content_md = html_to_markdown(page_html)

    # --- Step 5: Extract relevant section ---
    section = extract_relevant_section(content_md, query)

    # --- Step 6: Return structured output ---
    return {
        "content": section,
        "source_url": url,
        "section": title
    }