from web_search import search_planet_docs


if __name__ == "__main__":
    query = "how do I get a Planet API token using OAuth"
    result = search_planet_docs(query)

    print("\n===== SOURCE URL =====")
    print(result["source_url"])

    print("\n===== SECTION =====")
    print(result["section"])

    print("\n===== CONTENT (TRUNCATED) =====")
    print(result["content"][:1500])  # avoid dumping huge docs