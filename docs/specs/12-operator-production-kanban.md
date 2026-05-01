# 12 - Operator Production Kanban

## Linked Issue

- GitHub #9: Slice 8 - Build operator production kanban

## Goal

Build a focused production surface where Operators see only production work and advance tasks through ordered workflow stages using explicit buttons.

## Scope

- Operator-only navigation surface.
- Production task grouping by workflow stage.
- Button-based stage transitions.
- Blocked and waiting task states.
- Permission checks for stage advancement.
- Admin visibility into production tasks by order and by stage.

## Interaction Rules

- Do not implement drag-and-drop in v1.
- Every transition is an explicit button action.
- Blocked or waiting tasks must be visually distinguishable.
- Unauthorized users must not be able to advance tasks through hidden UI or direct server calls.

## Acceptance Criteria

- Operators see focused production navigation and no admin-only menus.
- Tasks are grouped by workflow stage.
- Operators can advance allowed tasks with explicit buttons.
- Blocked or waiting tasks cannot be advanced incorrectly.
- Permission checks prevent unauthorized transitions.
- Tests cover operator visibility, task grouping, advancement, blocked states, and permissions.
