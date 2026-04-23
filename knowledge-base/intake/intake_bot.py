# intake_bot.py
# M1 - Brandyn
#
# PURPOSE: A conversational chatbot that collects user information
# through a two-layer question flow and outputs a structured intake JSON
# ready to hand off to the workflow planner in M2.
#
# INPUT: none — this initiates the conversation
#
# OUTPUT: a dict matching the intake schema:
#   {
#     "region": {},                  <- GeoJSON object
#     "date_range": {
#       "start": "2024-01-01",
#       "end": "2024-06-01"
#     },
#     "temporal_resolution": "biweekly",
#     "planet_product": "PlanetScope",
#     "use_case": "bare soil detection",
#     "user_description": "raw text of what the user said",
#     "inferred_intent": "monitor tillage events in agricultural fields",
#     "constraints": ["needs cloud masking", "RGB+NIR available"]
#   }
#
# CONNECTS TO: 
#   - intake/page.tsx renders the conversation in the frontend
#   - convex/workflows.ts saves the output JSON to the database
#   - lib/agent/planner.ts receives this JSON in M2
#
# NOTE:
# This file should stay focused on the intake conversation only.
# The DSPy agent should be able to call one main function from here and get
# back a structured intake JSON.
#
# WHAT STILL NEEDS TO HAPPEN HERE:
# 1. Ask the fixed Layer 1 questions in order.
# 2. Generate Layer 2 follow-up questions based on what is still missing.
# 3. Stop asking once there is enough information for the planner.
# 4. Synthesize the final structured intake JSON from the conversation.
#

# HOW IT WORKS:
# LAYER 1 (always the same — ask these first, in order):
#   1. What region are you interested in? (country, bounding box, or draw on map)
#   2. What time range? (start and end date)
#   3. Which Planet product? (PlanetScope, Sentinel-2, Planetary Variables etc.)
#
# LAYER 2 (dynamic — based on Layer 1 answers):
#   After Layer 1, make an LLM call that receives:
#     - the Layer 1 answers
#     - the notebooks_metadata.json catalog
#   and generates follow-up questions to disambiguate the use case.
#   Max 3-5 follow-up questions (total conversation max 6-8 questions).
#   The LLM should stop asking when it has enough to populate the full schema.
#
# LAYER 2 PROMPT TEMPLATE:
#   "You are an assistant helping a user build a satellite data analysis
#    workflow using Planet APIs. The user has told you:
#    - Region: {region}
#    - Time range: {date_range}
#    - Planet product: {planet_product}
#
#    Here is a catalog of available workflows: {notebooks_metadata}
#
#    Ask the minimum number of follow-up questions (max 5) needed to
#    confidently select and parameterize the right workflow for this user.
#    When you have enough information, stop asking and output DONE."
#
# FINAL STEP:
#   Once conversation is complete, make a final LLM call to synthesize
#   everything the user said into the structured intake JSON.
#   This call should infer: use_case, inferred_intent, and constraints
#   from the raw conversation — don't ask the user for these explicitly.

from google import genai
import os

gem_key = os.getenv('GEMINI-API-KEY')

# The client gets the API key from the environment variable `GEMINI_API_KEY`.

client = genai.Client(api_key = gem_key)

# response = client.models.generate_content(
#     model="gemini-3-flash-preview", contents="Explain how AI works in a few words"
# )
# print(response.text)

# # The client gets the API key from the environment variable `GEMINI_API_KEY`.
# client = genai.Client()

# response = client.models.generate_content(
#     model="gemini-3-flash-preview", contents="Explain how AI works in a few words"
# )
# print(response.text)


q1 = "what's your request"
promt1 = input(q1)
q2 = "what's your request"
promt2 = input(q2)
q3 = "what's your request"
prompt3 = input(q3)

# def run_layer_one(prompt):
#     try:
#         response = client.models.generate_content(
#             model="gemini-3-flash",
#             contents=prompt
#         )





# TODO:
# def load_notebooks_metadata() -> dict:
#     # reads notebooks_metadata.json from knowledge-base/data/
#     pass

# def run_layer_one() -> dict:
#     # asks the 3 fixed questions, returns region, date_range, planet_product
#     pass

# def generate_layer_two_questions(layer_one: dict, metadata: dict) -> list[str]:
#     # LLM call: given layer one answers + metadata catalog,
#     # generate follow-up questions
#     pass

# def run_layer_two(questions: list[str]) -> dict:
#     # asks the dynamic follow-up questions, returns raw answers
#     pass

# def synthesize_intake_json(conversation_history: list) -> dict:
#     # final LLM call: turns full conversation into structured intake JSON
#     # infers use_case, inferred_intent, constraints from what user said
#     pass

# def run_intake() -> dict:
#     """
#     
#     """
#     # main function — runs full pipeline:
#     # run_layer_one -> generate_layer_two_questions -> run_layer_two
#     # -> synthesize_intake_json -> return intake dict
#     pass
