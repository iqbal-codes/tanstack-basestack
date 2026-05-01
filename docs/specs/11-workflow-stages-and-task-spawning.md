# 11 - Workflow Stages And Task Spawning

## Linked Issue

- GitHub #8: Slice 7 - Configure workflow stages and spawn production tasks

## Goal

Allow Admins to configure ordered workflow stages and create production tasks from approved orders.

## Scope

- Workflow stage create, edit, reorder, activate, and deactivate.
- Design review as a normal workflow stage.
- Product production requirements used for task context.
- Task spawning when an order is approved.
- Stable existing tasks when workflow configuration changes later.

## Task Spawning Module

Treat task spawning as a deep module with a small interface.

- Accept approved order lines and active workflow stages.
- Create the expected tasks in the expected initial stages.
- Snapshot product, variant, customer, order, and requirement context.
- Avoid mutating existing tasks when future workflow configuration changes.

## Acceptance Criteria

- Admins can manage ordered workflow stages.
- Design review can be configured like any other stage.
- Approving an order creates the expected production tasks.
- Existing tasks remain stable after workflow changes.
- Production tasks retain useful order, customer, product, and requirement context.
- Tests cover workflow configuration and task spawning outcomes.
