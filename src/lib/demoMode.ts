// Public demo hardening.
//
// Workflow pages render without a login: convex/workflows.ts:16 (getWorkflow) has
// no auth check, and neither do updateWorkflow/deleteWorkflow. So anyone holding a
// workflow link can reach anything that mutates it. While the site is public-facing
// we keep the chat's question-answering and turn off every write path.
//
// Set to true and redeploy to restore editing.
export const EDITING_ENABLED = false;

// Assembling a new workflow requires the Python agent server (knowledge-base/
// api_server.py), which is not hosted — PYTHON_API_URL is unset in production, so
// src/app/api/assemble-workflow/route.ts:17 falls back to 127.0.0.1 and never
// answers. Rather than let visitors watch a spinner run for ten minutes, we say so.
//
// To re-enable: host api_server.py, point route.ts:17 at it, then set this to true.
export const ASSEMBLY_ENABLED = false;

// A finished workflow to show people who land on the site. Workflow pages are
// publicly viewable, so this link works without an account.
export const DEMO_WORKFLOW_ID = 'j97e37qb7dvfzzs5zpdkfbrbz187yvka';
export const DEMO_WORKFLOW_PATH = `/workflow/${DEMO_WORKFLOW_ID}`;
