---
description: Model assignment rules for all agents and subagents.
---

# Model Assignment Rules

## Role → Model mapping

MUST follow this table for every agent and subagent spawned:

| Role                    | Model        | When to use                                               |
|-------------------------|--------------|-----------------------------------------------------------|
| Team Lead               | opus         | Coordination, synthesis, complex decomposition            |
| Teammate (default)      | sonnet       | Standard implementation tasks                             |
| Teammate (escalated)    | opus         | Complex architecture, security-critical, perf-sensitive   |
| Subagent (read-only)    | haiku        | File search, codebase exploration, quick research         |
| Subagent (code changes) | sonnet/opus  | Implementation or refactoring                             |

## Hard rules

- MUST NOT use opus for simple file reads, searches, or grep tasks
- MUST NOT use haiku for any task that writes or modifies files
- MUST default to sonnet when role is unclear
- MUST escalate to opus when the task involves:
  - Security-critical logic (auth, payments, RLS policies)
  - Database schema design or migrations
  - Multi-agent orchestration and coordination
  - Performance-sensitive paths (API routes under load)
- MUST use haiku for all read-only subagent tasks to preserve
  context budget and reduce token cost