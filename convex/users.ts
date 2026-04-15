// users.ts
// PURPOSE: Convex query and mutation functions for managing user profiles.
// CONNECTS TO:
//   - schema.ts for the users table definition
//   - src/app/page.tsx calls createUser on first sign in
//   - convex/workflows.ts references userId when creating workflows
//   - src/app/dashboard/page.tsx calls getUser to load profile
//
// FUNCTIONS NEEDED:
//
// queries (read):
//   - getUser(id)
//       returns a single user by id
//       used by dashboard and workflow pages to load user context
//
//   - getUserByEmail(email)
//       looks up a user by email
//       used on sign in to check if user already exists
//
// mutations (write):
//   - createUser(name, email)
//       called on first sign in
//       checks if user already exists before creating
//       returns the new user id
//
//   - updateUser(id, name)
//       called if the user updates their profile
//
// NOTE ON AUTH:
//   Convex has built-in auth integrations — check out Clerk or Auth0
//   as the easiest options to wire up with Next.js + Convex
//   See: https://docs.convex.dev/auth
//
// RESOURCES:
// https://docs.convex.dev/functions/queries
// https://docs.convex.dev/functions/mutations