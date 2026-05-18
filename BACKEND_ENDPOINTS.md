# Backend Endpoints

This document lists the API surface currently used by the Cairo Quarantine
Management frontend.

## Notes

- Base path is the same origin as the Next.js app.
- Admin API requests require the header:

```http
X-CQM-Admin-Request: 1
```

- Admin API requests generally require the admin session cookie created by
  `POST /api/admin/session`.
- Cron/internal APIs use bearer tokens in the `Authorization` header.
- Some important operations are implemented as Next.js Server Actions rather
  than explicit REST endpoints. They are listed at the end as backend contracts
  that may need to be converted if the backend is separated.

## Public APIs

| Method | Endpoint | Input | Response / Notes |
| --- | --- | --- | --- |
| `GET` | `/api/site-visitors` | None | `{ total }` |
| `POST` | `/api/site-visitors` | Cookie-based visitor count | `{ total, counted }` |
| `GET` | `/api/booking/availability` | Query: `officeId`, `preferredDate=YYYY-MM-DD` | `{ available, count, cap, fullMessage? }` |
| `POST` | `/api/office-requests/status` | JSON: `{ requests: [{ id, phone }] }` | Max 20 lookups. Returns `{ requests, missing }` |
| `GET` | `/api/firebase/public-config` | None | Public Firebase web config for service worker usage |
| `GET` | `/api/queue/position` | Query: `ticketId` | `{ ticketId, queueNumber, status, aheadCount, queueClosed, message }` |
| `POST` | `/api/queue/watch` | JSON: `{ ticketId, fcmToken }` | Registers FCM watch. Returns `{ ok: true }` |
| `DELETE` | `/api/queue/watch` | Query: `ticketId` | Deletes FCM watch. Returns `{ ok: true }` |

### `GET /api/booking/availability`

Query parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `officeId` | string | Yes | Max length: 120 |
| `preferredDate` | string | Yes | Format: `YYYY-MM-DD` |

Possible errors:

- `400 { error: "bad_params" }`
- `404 { error: "office_not_found" }`
- `429 { error: "rate_limited" }`
- `500 { error: "server", message }`

### `POST /api/office-requests/status`

Request body:

```json
{
  "requests": [
    {
      "id": "request-id",
      "phone": "01000000000"
    }
  ]
}
```

Constraints:

- Max request body: 4096 bytes
- Max lookup items: 20
- `id` max length: 120
- `phone` max length: 30

Response body:

```json
{
  "requests": [],
  "missing": []
}
```

### `GET /api/queue/position`

Query parameters:

| Name | Type | Required |
| --- | --- | --- |
| `ticketId` | string | Yes |

Response body:

```json
{
  "ticketId": "ticket-id",
  "queueNumber": 12,
  "status": "waiting",
  "aheadCount": 3,
  "queueClosed": false,
  "message": "..."
}
```

Allowed queue statuses:

- `waiting`
- `completed`

### `POST /api/queue/watch`

Request body:

```json
{
  "ticketId": "ticket-id",
  "fcmToken": "firebase-cloud-messaging-token"
}
```

## Cron / Internal APIs

| Method | Endpoint | Auth | Input | Response / Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/api/queue/notify-scan` | `Authorization: Bearer $QUEUE_NOTIFY_CRON_SECRET` | Optional JSON: `{ officeId, date }` | Runs queue notification scan |
| `POST` | `/api/admin/queue/close` | `Authorization: Bearer $DAILY_QUEUE_CRON_SECRET` | Optional JSON: `{ officeId, date }` | Closes daily queue for one office or all active offices |
| `POST` | `/api/admin/maintenance/retention` | `Authorization: Bearer $MAINTENANCE_CRON_SECRET` | None | Runs retention/archive maintenance |

## Admin APIs

All admin APIs below require:

```http
X-CQM-Admin-Request: 1
```

Most also require a valid admin session cookie.

| Method | Endpoint | Input | Response / Notes |
| --- | --- | --- | --- |
| `POST` | `/api/admin/session` | JSON: `{ idToken }` | Creates admin session cookie. Returns `{ ok: true }` |
| `POST` | `/api/admin/logout` | None | Deletes admin session cookie. Returns `{ ok: true }` |
| `GET` | `/api/admin/firebase-custom-token` | None | Returns `{ customToken, uid }` |
| `GET` | `/api/admin/requests/export` | Query filters | Returns `.xlsx` export |
| `GET` | `/api/admin/firestore/collection-export` | Query: `collection`, optional `limit` | Returns NDJSON backup file |
| `POST` | `/api/admin/firestore/collection-import` | JSON: `{ collection, format, payload }` | Imports documents. Returns `{ written, errors }` |
| `POST` | `/api/admin/firestore/collection-purge` | JSON: `{ operation, confirm }` | Deletes matching records. Returns `{ deleted, truncated, maxPerCall }` |

### `POST /api/admin/session`

Request body:

```json
{
  "idToken": "firebase-auth-id-token"
}
```

Response:

```json
{
  "ok": true
}
```

Common error codes:

- `invalid_json`
- `missing_token`
- `auth_failed`
- `forbidden_no_profile`
- `datastore_permission`
- `datastore_unavailable`
- `server_misconfigured`
- `rate_limited`

### `GET /api/admin/requests/export`

Query parameters:

| Name | Type | Notes |
| --- | --- | --- |
| `types` | comma-separated string | Example: `booking,complaint` |
| `type` | repeated string | Alternative to `types` |
| `officeId` | string | Use `all` or omit for all accessible offices |
| `travelerStateIds` | comma-separated string | Dynamic traveler state ids |
| `travelerStateId` | repeated string | Alternative to `travelerStateIds` |
| `travelerCategories` | comma-separated string | Legacy traveler categories |
| `travelerCategory` | repeated string | Alternative to `travelerCategories` |
| `from` | date string | Export lower date bound |
| `to` | date string | Export upper date bound |

Allowed request types:

- `booking`
- `complaint`
- `proposal`

Allowed legacy traveler categories:

- `international`
- `hajj_umrah`
- `citizen`

Special traveler token:

- `uncategorized`

Response:

- Content-Type:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Headers may include:
  - `X-Export-Row-Count`
  - `X-Export-Capped`
  - `X-Export-Max-Rows`

### `GET /api/admin/firestore/collection-export`

Query parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `collection` | string | Yes | Must be one of the allowed collection keys below |
| `limit` | number | No | Defaults to export max rows |

Allowed `collection` values:

- `requests`
- `activityLogs`
- `requestsArchive`
- `activityLogsArchive`
- `offices`
- `messageTemplates`

Response:

- Content-Type: `application/x-ndjson; charset=utf-8`
- Headers may include:
  - `X-Export-Doc-Count`
  - `X-Export-Capped`
  - `X-Export-Max-Rows`

### `POST /api/admin/firestore/collection-import`

Request body:

```json
{
  "collection": "requests",
  "format": "ndjson",
  "payload": "{\"id\":\"doc-id\",\"data\":{}}\n"
}
```

Allowed `format` values:

- `ndjson`
- `json`

Allowed `collection` values:

- `requests`
- `activityLogs`
- `requestsArchive`
- `activityLogsArchive`
- `offices`
- `messageTemplates`

Response:

```json
{
  "written": 10,
  "errors": []
}
```

### `POST /api/admin/firestore/collection-purge`

Request body:

```json
{
  "operation": "requests_complaints",
  "confirm": "أؤكد حذف جميع الشكاوى"
}
```

Allowed `operation` values and confirmation phrases:

| Operation | Confirmation phrase |
| --- | --- |
| `activity_log` | `أؤكد حذف سجل الإجراءات بالكامل` |
| `requests_all` | `أؤكد حذف جميع الطلبات` |
| `requests_complaints` | `أؤكد حذف جميع الشكاوى` |
| `requests_proposals` | `أؤكد حذف جميع المقترحات` |

Response:

```json
{
  "deleted": 100,
  "truncated": false,
  "maxPerCall": 1000
}
```

## Server Actions That Behave Like Backend Operations

These are not explicit REST endpoints in `app/api`. They are Next.js Server
Actions. If the frontend is moved to a separate backend contract, these should
probably become explicit API endpoints.

### Public booking / request actions

Source: `app/[locale]/(public)/booking/actions.ts`

#### `submitOfficeRequest`

Form fields:

| Field | Type | Notes |
| --- | --- | --- |
| `locale` | string | Locale fallback is default locale |
| `officeId` | string | Required |
| `governorateId` | string | Required |
| `type` | string | `booking`, `complaint`, or `proposal` |
| `travelerStateId` | string | Required for `booking` |
| `preferredDate` | string | Required for `booking`, format `YYYY-MM-DD` |
| `name` | string | Required, 2 to 120 chars |
| `phone` | string | Required, max 30 chars |
| `details` | string | Required for complaints/proposals, max 1000 chars |
| `hasSpecialNeeds` | checkbox | Booking only |
| `hasElderly` | checkbox | Booking only |

Creates a public office request and returns:

```ts
{
  ok: boolean;
  message: string;
  duplicate?: boolean;
  errors?: Record<string, string>;
  request?: PublicOfficeRequestStatus & { phone: string; passToken: string };
}
```

### Public check-in actions

Source: `app/[locale]/(public)/checkin/actions.ts`

#### `checkinLookupAction`

Form fields:

- `officeId`
- `lookup`

Looks up an existing request by request number or phone and creates/restores
today's queue ticket.

#### `checkinRestoreAction`

Arguments:

- `officeId`
- `ticketId`

Restores an existing check-in session for today's queue.

#### `checkinQuickAction`

Form fields:

- `officeId`
- `name`
- `phone`
- `lookup`
- `travelerStateId`
- `hasSpecialNeeds`
- `hasElderly`
- `details`

Creates a quick booking request and adds it to today's queue.

### Office dashboard queue actions

Source: `app/[locale]/office-dashboard/[officeId]/queue/actions.ts`

#### `searchTicketAction`

Form fields:

- `officeId`
- `queueDate`
- `search`

Searches queue tickets by queue number, request number, or phone.

#### `completeTicketAction`

Form fields:

- `officeId`
- `ticketId`
- `locale`

Marks a queue ticket as completed.

### Admin server actions

Source: `app/[locale]/admin/actions.ts`

| Action | Purpose |
| --- | --- |
| `logoutAdmin(locale)` | Deletes session cookie and redirects to login |
| `deleteRequestSuperAdminAction(formData)` | Super admin deletes one request |
| `updateRequestAction(formData)` | Updates request status and notes |
| `markWhatsappSentAction(formData)` | Marks WhatsApp message as sent |
| `addRequestToQueueAction(prev, formData)` | Adds booking request to today's queue |
| `saveTemplateAction(formData)` | Creates/updates message template |
| `deleteTemplateAction(formData)` | Deletes message template |
| `saveUserProfileAction(formData)` | Creates/updates admin user |
| `deleteUserProfileAction(formData)` | Deletes admin user |
| `saveBookingSettingsAction(formData)` | Updates booking settings |
| `saveOfficeAction(formData)` | Creates/updates office |
| `setOfficeActiveAction(formData)` | Activates/deactivates office |
| `saveTravelerStateAction(formData)` | Creates/updates traveler state |
| `setTravelerStateActiveAction(formData)` | Activates/deactivates traveler state |
| `saveVaccineAction(formData)` | Creates/updates vaccine |
| `setVaccineActiveAction(formData)` | Activates/deactivates vaccine |
| `runRetentionMaintenanceAction()` | Runs retention maintenance |

## Main Data Types

### Request type

```ts
type OfficeRequestType = "booking" | "complaint" | "proposal";
```

### Request status

```ts
type OfficeRequestStatus =
  | "new"
  | "in_progress"
  | "contacted"
  | "completed"
  | "cancelled";
```

### Traveler category

```ts
type TravelerCategory = "international" | "hajj_umrah" | "citizen";
```

### Admin role

```ts
type AdminRole =
  | "super_admin"
  | "governorate_admin"
  | "office_admin"
  | "office_user";
```

### Queue ticket status

```ts
type QueueTicketStatus = "waiting" | "completed";
```

## Firestore Collections Used By The App

The app reads/writes these Firestore collections:

- `requests`
- `activityLogs`
- `requestsArchive`
- `activityLogsArchive`
- `offices`
- `messageTemplates`
- `users`
- `vaccines`
- `traveler_states`
- `settings`
- `todayQueue`
- `dailyStats`
- `queueWatches`
- `stats`

