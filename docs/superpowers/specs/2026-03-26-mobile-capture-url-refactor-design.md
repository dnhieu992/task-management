# Mobile Capture URL Refactor Design

**Date:** 2026-03-26
**Status:** Approved

## Problem

The `POST /api/mobile-capture/photo` and `POST /api/mobile-capture/combined` endpoints upload files directly via multipart form data. In production, the infrastructure layer (API Gateway / CloudFront / WAF) blocks these POST requests with 403 because the routes are not whitelisted. GET and PATCH requests to the same controller work fine.

## Solution

Remove file upload responsibility from mobile-capture endpoints. The frontend will upload files via the existing `POST /api/v2/file-upload` endpoint (already whitelisted in production), then pass the resulting S3 URLs to a new JSON-only mobile-capture create endpoint.

Additionally, consolidate the three update endpoints (`update`, `updateNotes`, `updateCoordinates`) into a single `PATCH /:captureId` endpoint.

## Approach

**Approach A (chosen): URL-only endpoint.** The new `POST /api/mobile-capture` accepts a JSON body with optional media URLs. No `FileInterceptor`, no multipart. The frontend handles file uploads separately.

Other approaches considered:
- **Approach B:** Accept both URLs and files — more complex, still has infrastructure blocking issue
- **Approach C:** Move upload endpoints to whitelisted path — hacky, inconsistent naming

## API Contract

### Endpoints after refactor

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/mobile-capture` | List records (paginated) |
| `GET` | `/api/mobile-capture/:captureId` | Get one record |
| `POST` | `/api/mobile-capture` | Create record (JSON with URLs) |
| `PATCH` | `/api/mobile-capture/:captureId` | Update record (partial) |
| `DELETE` | `/api/mobile-capture/:captureId` | Delete record |

### Removed endpoints

| Method | Path | Reason |
|---|---|---|
| `POST` | `/api/mobile-capture/photo` | Replaced by `POST /api/mobile-capture` |
| `POST` | `/api/mobile-capture/combined` | Replaced by `POST /api/mobile-capture` |
| `PATCH` | `/api/mobile-capture/:captureId/notes` | Merged into `PATCH /:captureId` |
| `PATCH` | `/api/mobile-capture/:captureId/coordinates` | Merged into `PATCH /:captureId` |

### CreateMobileCaptureDto (new)

```typescript
{
  photo_url?: string;
  video_url?: string;
  audio_url?: string;
  lat?: string;
  lng?: string;
  accuracy?: string;
  notes?: string;
  task_id?: string;
}
```

### Frontend upload flow

1. Upload file(s) via `POST /api/v2/file-upload` (field name: `file`) -> returns `{ data: "<s3_url>" }`
2. Call `POST /api/mobile-capture` with the S3 URL(s) in JSON body

## File Changes

| File | Action |
|---|---|
| `dtos/create-mobile-capture.dto.ts` | **New** — CreateMobileCaptureDto |
| `dtos/update-notes.dto.ts` | **Delete** — merged into existing update |
| `dtos/update-coords.dto.ts` | **Delete** — merged into existing update |
| `mobile-capture.controller.ts` | **Modify** — remove 4 endpoints (photo, combined, notes, coordinates), add 1 (POST /), remove file interceptor imports |
| `mobile-capture.service.ts` | **Modify** — remove `uploadPhoto`, `uploadCombined`, `uploadToS3`, `updateNotes`, `updateCoordinates`, add `create`. Remove S3Provider dependency |
| `mobile-capture.module.ts` | **Modify** — remove S3Provider from providers if only used here |
| `mobile-capture.controller.spec.ts` | **Modify** — update tests to match new endpoints |
| `mobile-capture.service.spec.ts` | **Modify** — update tests, remove S3/uuid mocks |

## Service Changes

### Remove
- `uploadPhoto` method
- `uploadCombined` method
- `uploadToS3` private helper
- `updateNotes` method
- `updateCoordinates` method
- S3Provider constructor dependency (if not used elsewhere in this service)

### Add
- `create(dto: CreateMobileCaptureDto, company_code: string, created_by: string)` — creates a MobileCaptureRecord with URLs directly from the DTO

### Keep unchanged
- `getList`
- `update` (already handles partial updates for notes, lat, lng, accuracy, task_id)
- `getSavedImages`
- `getSavedImageById`
- `deleteSavedImageById`
- `remove`

## Test Changes

### Controller spec
- Remove tests for `uploadPhoto`, `uploadCombined`, `updateNotes`, `updateCoordinates`
- Add tests for new `POST /api/mobile-capture` create endpoint

### Service spec
- Remove tests for `uploadPhoto`, `uploadCombined`, `uploadToS3`, `updateNotes`, `updateCoordinates`
- Remove `uuid` mock (no longer generating S3 keys in service)
- Remove `S3Provider` mock (no longer uploading in service)
- Add tests for new `create` method

## Constraints

- `UpdateMobileCaptureDto` does NOT support updating `photo_url`, `video_url`, `audio_url`
- The existing `POST /api/v2/file-upload` uploads to the bucket root (no subfolder like `mobile-capture/photos/`), so mobile-capture files will be mixed with other uploads in the bucket
- This is a breaking change for the frontend — both `POST /photo`, `POST /combined`, `PATCH /notes`, and `PATCH /coordinates` are removed
