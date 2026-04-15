// schema.ts
// PURPOSE: Defines the Convex database schema for the entire app.
// CONNECTS TO: all convex/*.ts files, all src/lib/agent/*.ts files
//
// TABLES NEEDED:
//
// users
//   - name, email, createdAt
//
// workflows
//   - belongs to a user
//   - stores the full intakeJson (see intake_bot.py for the schema shape)
//   - stores the assembled notebook as an array of cells (cell_type, source)
//   - stores which source notebook cells were used (notebook filename, cell_index, content)
//   - createdAt, updatedAt
//
// conversations
//   - belongs to a workflow
//   - one row per message
//   - role: "user" or "assistant"
//   - content: message text
//   - createdAt
//
// RESOURCES:
// https://docs.convex.dev/database/schemas