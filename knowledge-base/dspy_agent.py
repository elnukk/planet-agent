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


DEFAULT_MODEL = os.getenv("DSPY_MODEL", "gemini/gemini-2.5-flash")


class BiodiversityAgentSignature(dspy.Signature):
    """
    
    """

    user_request = dspy.InputField()
    response = dspy.OutputField()


class BiodiversityWorkflowAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        self.agent = dspy.ReAct(BiodiversityAgentSignature, tools=[])

    def forward(self, user_request: str):
        return self.agent(user_request=user_request)


def build_agent():
    # Central place to choose the model used by DSPy.
    # If the team changes models later, they should only need to change
    # configuration here rather than rewriting the agent structure.
    lm = dspy.LM(DEFAULT_MODEL)
    dspy.configure(lm=lm)
    return BiodiversityWorkflowAgent()
