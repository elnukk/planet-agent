import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from agent.planner import plan_workflow
from agent.coder import assemble_notebook

app = FastAPI(title="Planet Agent API")

_origins = ["http://localhost:3000"]
if os.getenv("FRONTEND_URL"):
    _origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class AssembleRequest(BaseModel):
    intake: dict


@app.post("/assemble")
def assemble(req: AssembleRequest):
    try:
        plan = plan_workflow(req.intake)
        result = assemble_notebook(plan)

        seen: set[tuple[str, int]] = set()
        source_notebooks = []
        for step in plan.get("steps", []):
            for nb in step.get("provenance", {}).get("notebook_cells", []):
                key = (nb["notebook"], nb["cell_index"])
                if key not in seen:
                    seen.add(key)
                    source_notebooks.append({
                        "filename": nb["notebook"],
                        "cellIndex": nb["cell_index"],
                        "content": "",
                    })

        return {"cells": result["cells"], "packages": result["packages"], "sourceNotebooks": source_notebooks}
    except Exception as e:
        print(f"[api_server] Assembly error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
