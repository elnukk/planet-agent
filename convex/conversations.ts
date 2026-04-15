// conversations.ts
// PURPOSE: Convex query and mutation functions for managing chat history
// per workflow. One message per row.
// CONNECTS TO:
//   - schema.ts for the conversations table definition
//   - src/components/workflow/ChatSidebar.tsx reads and writes from here
//   - src/lib/agent/chatAssistant.ts loads conversation history from here
//     to maintain context across messages (M3)
//
// FUNCTIONS NEEDED:
//
// queries (read):
//   - getConversation(workflowId)
//       returns all messages for a workflow in chronological order
//       used by ChatSidebar to render the chat history on load
//
// mutations (write):
//   - sendMessage(workflowId, role, content)
//       called every time a user or assistant sends a message
//       role is either "user" or "assistant"
//       returns the new message id
//
//   - clearConversation(workflowId)
//       deletes all messages for a workflow
//       used if the user wants to reset the chat
//
// RESOURCES:
// https://docs.convex.dev/functions/queries
// https://docs.convex.dev/functions/mutations