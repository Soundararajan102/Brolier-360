# Workspace Rules

## Core Documentation Requirement
Always consult the `.core` folder in this workspace before planning or executing tasks. 

1. Review `d:\Brolier 360\.core\ARCHITECTURE.md` to understand the folder structure and architectural design. Log any significant structural changes there.
2. Review `d:\Brolier 360\.core\DATA_MODELS.md` to understand the database operations and module models.
3. Review `d:\Brolier 360\.core\RULES.md` for coding constraints and styling conventions.

## 🚨 MANDATORY ACTION: SESSION HISTORY
**CRITICAL RULE: YOU MUST ALWAYS WITHOUT EXCEPTION update `d:\Brolier 360\.core\SESSION_HISTORY.md` BEFORE ending your turn.**
Every single action you take must be logged in the history file with the current timestamp, the user's request, and the action taken. Do NOT wait for the user to remind you. If you perform an action (like installing a plugin, modifying a file, or running a command), your final step MUST be to update the session history file.

## 🚨 MANDATORY ACTION: DOCUMENTATION PRESERVATION
**CRITICAL RULE: NEVER OVERWRITE HISTORICAL DOCUMENTATION.**
When making architectural pivots or massive changes to the data models, do NOT overwrite `.core/ARCHITECTURE.md` or `.core/DATA_MODELS.md`. Instead, you MUST **APPEND** your new structures under a timestamped header (e.g. `### [2026-06-30 13:25:54] New Architecture`). The original, historical structures must remain intact above it so the project can be rewound to previous states if necessary.
