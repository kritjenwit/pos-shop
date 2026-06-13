# ADR-0023: ECC Agent-Sort Install Plan

**Date**: 2026-06-13
**Status**: Accepted

## Context

The development environment loads the full ECC (Everything Claude Code) bundle — ~72 user-level skills, 48 agents, 78 commands, ~92 rules across 12 language directories, and ~35 hook scripts — into every session. Most of these target languages and frameworks not used by this project (Python, Go, Rust, Java, Kotlin, C++, C#, Laravel, Django, Flutter, etc.).

Every session pays the context overhead of loading off-stack components. This degrades signal-to-noise, especially during complex multi-step tasks where context budget is tight.

An `agent-sort` pass was run to classify every ECC component into DAILY (load every session) vs LIBRARY (keep on disk, don't load by default) using codebase evidence.

## Decision

Adopt the two-bucket classification from the `agent-sort` pass and trim the session load surface by ~67%.

### Classification criteria

- **DAILY** — strongly matched to the repo's actual stack (TypeScript/React/Vite/Supabase/Cloudflare/Vitest/Playwright) or essential for every-session workflow (context management, debugging, planning)
- **LIBRARY** — off-stack language/framework, one-time tooling, or components that add context overhead without immediate relevance

### DAILY bucket (101 components)

**Skills (32)** — frontend-patterns, frontend-design, coding-standards, e2e-testing, web-perf, supabase (project + user), supabase-postgres-best-practices (project), cloudflare, wrangler, workers-best-practices, api-design, backend-patterns, caveman (project), diagnose (project), scrutinize, tdd (project), grill-me, grill-with-docs, improve-codebase-architecture, to-issues, to-prd, triage, setup-matt-pocock-skills, zoom-out, write-a-skill, agent-sort, strategic-compact, iterative-retrieval

**Agents (16)** — build-error-resolver, code-architect, code-explorer, code-reviewer, code-simplifier, planner, performance-optimizer, refactor-cleaner, security-reviewer, silent-failure-hunter, tdd-guide, type-design-analyzer, typescript-reviewer, a11y-architect, e2e-runner, database-reviewer

**Commands (20)** — verify, quality-gate, plan, docs, tdd, test-coverage, code-review, build-fix, checkpoint, resume-session, save-session, multi-frontend, multi-execute, multi-workflow, orchestrate, feature-dev, prune, context-budget, update-codemaps, aside

**Rules (3 dirs, 20 files)** — common/*, typescript/*, web/*

**Hooks (13)** — check-console-log, config-protection, cost-tracker, post-edit-console-warn, post-edit-format, post-edit-typecheck, quality-gate, session-start-bootstrap, suggest-compact, session-activity-tracker, session-end, evaluate-session, post-bash-command-log

### LIBRARY bucket (208 components)

Retained on disk, removed from session load:

- 42 skills — all off-stack languages, durable-objects, sandbox-sdk, agents-sdk, cloudflare-email-service, mcp-server-patterns, configure-ecc, hookify-rules, plankton-code-quality, code-tour, council, eval-harness, tdd-workflow, verification-loop, ai-regression-testing, continuous-learning
- 32 agents — all language-specific reviewers/resolvers, GAN agents, healthcare-reviewer, opensource-*, harness-optimizer, loop-operator, comment-analyzer, conversation-analyzer, pr-test-analyzer
- 58 commands — all `cpp-*`, `flutter-*`, `go-*`, `gradle-*`, `kotlin-*`, `rust-*` build/review/test commands; `gan-*`, `hookify-*`, `instinct-*`, `loop-*`; `claw`, `devfleet`, `eval`, `evolve`, `jira`, `learn*`, `model-route`, `pm2`, `projects`, `prompt-optimize`, `rules-distill`, `santa-loop`, `setup-pm`, `skill-*`, `review-pr`
- 8 rule directories — `cpp/*`, `csharp/*`, `dart/*`, `golang/*`, `java/*`, `kotlin/*`, `perl/*`, `php/*`, `python/*`, `rust/*`, `swift/*`, `zh/*`
- 22 hooks — `auto-tmux-dev`, `block-no-verify`, `check-hook-enabled`, `design-quality-check`, `gateguard-fact-force`, `governance-capture`, `mcp-health-check`, `plugin-hook-bootstrap`, `post-bash-pr-created`, `post-edit-accumulator`, `pre-bash-commit-quality`, `pre-bash-dev-server-block`, `pre-bash-tmux-reminder`, `run-with-flags*`, `stop-format-typecheck`, `doc-file-warning`, `pre-write-doc-warn`

### Implementation

The plan is applied through:
- Project-level `opencode.json` — references only DAILY skills, agents, commands, rules
- `hooks.json` at user level — activates only DAILY hooks, deactivates LIBRARY hooks

No files are deleted. LIBRARY components remain on disk and can be loaded on demand or re-promoted if the stack changes.

## Consequences

- Session load surface reduced from ~309 to ~101 components (~67% reduction)
- No files deleted — easy reversal if stack changes
- Off-stack skills/agents/commands remain accessible through search or manual activation
- Periodic re-sort recommended if the repo adds new languages or frameworks
