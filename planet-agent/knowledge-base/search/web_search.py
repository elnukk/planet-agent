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

# HOW IT WORKS:
# 1. Take the query string
# 2. Use a web search API (Tavily or Google Search API, or https://serpapi.com/search-api) to search docs.planet.com
# 3. Fetch the top result page
# 4. Extract the relevant section using BeautifulSoup + markdownify
# 5. Return content + source URL

# SUGGESTED LIBRARIES:
# pip install tavily-python beautifulsoup4 markdownify requests
# Tavily is the easiest search API to get started with - free tier available
# at https://tavily.com - designed specifically for AI agents

# TODO:
# def search_planet_docs(query: str) -> dict:
#     pass

# def fetch_page_content(url: str) -> str:
#     pass

# def extract_relevant_section(content: str, query: str) -> str:
#     pass