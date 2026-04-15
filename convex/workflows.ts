// workflows.ts
// PURPOSE: Convex query and mutation functions for saving and retrieving workflows.
// CONNECTS TO: 
//   - schema.ts for the workflows table definition
//   - src/lib/agent/planner.ts calls these in M2 to save assembled workflows
//   - src/app/dashboard/page.tsx reads from here to list saved workflows
//   - src/app/workflow/[id]/page.tsx reads from here to load a single workflow
//
// FUNCTIONS NEEDED:
//
// queries (read):
//   - getWorkflow(id) 
//       returns a single workflow by id
//       used by the workflow view page to load the notebook + intake JSON
//
//   - getUserWorkflows(userId)
//       returns all workflows for a user
//       used by the dashboard to list saved workflows
//
// mutations (write):
//   - createWorkflow(userId, intakeJson, notebookCells, sourceCells)
//       called after assembly is complete in M2
//       saves the full workflow to the database
//       returns the new workflow id
//
//   - updateWorkflow(id, notebookCells)
//       called when the user edits a workflow via chat in M3
//       updates the notebook cells in place
//
//   - deleteWorkflow(id)
//       deletes a workflow and its associated conversations
//
// RESOURCES:
// https://docs.convex.dev/functions/queries
// https://docs.convex.dev/functions/mutations