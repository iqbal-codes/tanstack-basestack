# 16 - Reusable Asset Upload Components And R2 Pipeline

## Goal

Define one reusable Asset upload standard for Pabriq that supports image, video, and file uploads with private Cloudflare R2 storage, signed URLs, and reusable UI variants.

## Scope

- Reusable upload components only (no route-level feature integration in this slice).
- Cloudflare R2-backed upload pipeline and Asset persistence contract.
- Image processing with `sharp` for `preview`, `full`, and `original` variants.
- Video and non-image file support with `original` variant only.
- Tenant-safe access control, validation, and retention policies.

## Domain Language

- Canonical term: `Asset`.
- `ownerType`: `product | customer | organization | order | productionTask`.
- `usage`: `logo | profile | gallery | attachment`.
- `assetKind`: `image | video | file`.
- Variant keys (global): `preview | full | original`.

## Reusable Component Architecture

- Core primitive: `AssetUploadDropzone`.
- Presets:
  - `PhotoGridUpload`.
  - `FileListUpload`.
- Transport model:
  - Component is transport-agnostic via uploader adapter.
  - Default adapter targets R2 pipeline.
- State model:
  - Controlled API support for TanStack Form wrappers.
  - Uncontrolled API support for standalone pages.
- Copy model:
  - No hardcoded user-facing text.
  - All copy injected via props using `use-intl` keys.

## Upload Flow

- Upload behavior is immediate on file selection/drop.
- Queue concurrency: maximum 3 parallel uploads per dropzone.
- Submit gating:
  - Parent submit remains blocked while any file is `uploading` or `failed`.
  - Failed files must be retried or removed before submit unlocks.
- Remove UX:
  - Supports short undo window before final removal request.

## Server Contract

- Two-phase protocol:
  1. `createUploadIntent`.
  2. `finalizeUpload`.
- Core generic server module lives in `#/features/assets/server.ts`.
- Feature-specific wrappers are optional and can be added later.

## Storage And Security

- Objects are private in R2.
- Read access uses short-lived signed URLs.
- Signed URL TTL:
  - `preview`: 15 minutes.
  - `full`: 15 minutes.
  - `original`: 5 minutes.
- One bucket per environment (`dev`, `staging`, `prod`).
- R2 object key pattern:
  - `org/{orgId}/{ownerType}/{ownerId-or-draftId}/{assetId}/{variant}.{ext}`.
- Server validates file signatures (magic bytes). Do not trust browser MIME alone.
- Raster-only image uploads in v1 (`png`, `jpeg`, `webp`). SVG is rejected.

## Image Processing

- v1 image processing is synchronous during upload finalization.
- Processing profiles are server-owned and allowlisted:
  - `logo`.
  - `gallery`.
  - `attachmentImage`.
- Variant generation:
  - `image`: `preview`, `full`, `original`.
  - `video` and `file`: `original` only.
- Format policy:
  - Keep `original` in source format.
  - Generate `preview/full` as JPEG for broad compatibility.
  - Preserve PNG for `full` when transparency is required.

## Persistence Model

- Use normalized tables:
  - `assets`.
  - `asset_variants`.
- Keep immutable records and version by new Asset rows.
- One active version per constrained slot where applicable.
- No checksum deduplication in v1 (always create a new version).
- Required metadata:
  - `id`, `orgId`, `ownerType`, `ownerId | draftId`, `usage`, `assetKind`.
  - `originalFilename`, `mimeType`, `sizeBytes`, `uploadedByUserId`.
  - `status`, timestamps, optional `deletedAt`.
  - `checksumSha256` recommended.
- Optional metadata by kind:
  - image dimensions.
  - video duration when available at low cost.

## Draft And Retention Lifecycle

- Pre-create uploads use draft ownership.
- Draft TTL: 24 hours for unbound assets.
- Soft-retention after delete/replace: 30 days.
- Physical object purge runs via scheduled cleanup job.
- Cleanup strategy:
  - Daily scheduler trigger.
  - Idempotent cleanup function.
  - Opportunistic best-effort cleanup on relevant asset writes.

## Authorization

- Ownership integrity is enforced in server functions (owner exists and belongs to org).
- Role matrix in v1:
  - `product`, `customer`, `organization.logo`: `owner | admin`.
  - `order` attachment: `owner | admin | member`.
  - `productionTask` attachment: `owner | admin`.
- Public customer token uploads:
  - Allowed only for `order` assets tied to token-scoped `orderId`.
  - Allowed only when token scope is writable.

## Validation Limits

- Limits apply to active assets per owner.
- `logo`: max 1 active, image-only, max 5 MB.
- `profile`: max 1 active, image-only, max 8 MB.
- `gallery`: max 20 active, image/video, max 25 MB each.
- `attachment`: max 50 active, image/video/doc, max 100 MB each.

## i18n

- Add new translation namespace: `assetUpload`.
- Include grouped keys for:
  - actions.
  - states.
  - errors.
  - hints.

## Explicit Deferrals

- Route-level integration in product/customer/order pages.
- Customer create-flow adjustments needed for draft finalization.
- Video transcoding and thumbnails.
- Resumable/chunked uploads.
- SVG upload support.
- Cross-owner deduplication.

## ADR Requirement

Create one ADR for this architecture because this design is hard to reverse, cross-cutting, and chosen through multiple trade-offs.

## Acceptance Criteria

- Reusable core and two presets exist with typed controlled and uncontrolled APIs.
- R2-backed two-phase upload contract is implemented with authz and validation.
- Image processing and variant generation follow the profile and format policies.
- Signed URL access, retention, and cleanup behavior match policy.
- Upload state machine blocks parent submit on `uploading` or `failed` states.
- Tests cover component behavior, queue logic, and server validation boundaries.
