"""
DSPy scaffold.

When your modules are ready, this agent can register them as tools:
- notebook search from `agentic_search.py`
- docs search from `search/web_search.py`
- intake from `intake/intake_bot.py`

HOW TOOL WIRING SHOULD WORK:
- Step 1: import the student-owned function near the top of this file.
- Step 2: add that function into the `tools=[...]` list inside `dspy.ReAct(...)`.
- Step 3: keep the function's input/output shape stable so the agent can rely on it.

EXPECTED TOOL SHAPES:
- Notebook search tool:
  `search_notebooks(query: str) -> list[dict]`
- Docs search tool:
  `search_planet_docs(query: str) -> dict`
- Intake tool:
  `run_intake(...) -> dict`

EXAMPLE OF WHAT WILL BE ADDED LATER:
- import `search_notebooks` from `agentic_search`
- import `search_planet_docs` from `search/web_search`
- import `run_intake` from `intake/intake_bot`
- then change `tools=[]` into something like:
  `tools=[search_notebooks, search_planet_docs, run_intake]`

"""

import os

import dspy

from search.web_search import search_planet_docs

DEFAULT_MODEL = os.getenv("DSPY_MODEL", "gemini/gemini-2.5-flash")


class BiodiversityAgentSignature(dspy.Signature):
    """
    You are an agent that helps build satellite data workflows using Planet APIs.

    You have access to a tool:

    search_planet_docs(query: str) -> dict

    Use this tool when you need authoritative, up-to-date information from Planet's official documentation, including:
    - API endpoints and parameters
    - authentication methods (OAuth, API keys, tokens)
    - rate limits and quotas
    - data product specifications (e.g., bands, resolutions)
    - error messages and expected responses

    The tool returns:
    {
        "content": relevant extracted documentation text,
        "source_url": the official docs page,
        "section": page title
    }

    Only use this tool when specific technical details are required.
    Do not use it for general reasoning or when the answer can be inferred.

    Always prefer this tool over guessing API details.
    """

    user_request = dspy.InputField()
    response = dspy.OutputField()


class BiodiversityWorkflowAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        self.agent = dspy.ReAct(BiodiversityAgentSignature, tools=[search_planet_docs])

    def forward(self, user_request: str):
        return self.agent(user_request=user_request)


def build_agent():
    # Central place to choose the model used by DSPy.
    # If the team changes models later, they should only need to change
    # configuration here rather than rewriting the agent structure.
    lm = dspy.LM(DEFAULT_MODEL)
    dspy.configure(lm=lm)
    return BiodiversityWorkflowAgent()
