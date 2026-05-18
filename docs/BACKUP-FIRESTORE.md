# Firestore backup and restore

## Daily export (Google Cloud)

1. Create a bucket, e.g. `gs://YOUR_PROJECT-firestore-backups`.
2. Grant the Firestore service account `Storage Object Creator` on the bucket.
3. Schedule export:

```bash
gcloud firestore export gs://YOUR_PROJECT-firestore-backups/$(date +%Y-%m-%d) \
  --project=YOUR_PROJECT_ID
```

Use [Cloud Scheduler](https://cloud.google.com/scheduler) to run this weekly or daily.

## Restore

```bash
gcloud firestore import gs://YOUR_PROJECT-firestore-backups/YYYY-MM-DD \
  --project=YOUR_PROJECT_ID
```

Import overwrites existing data in the target database. Run against a staging project first.

## Booking stats after restore

If you restore an older backup, re-run:

```bash
node --env-file=.env.local scripts/backfill-booking-day-stats.mjs
```
