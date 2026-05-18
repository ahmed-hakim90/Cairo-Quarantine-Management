/**
 * Seed PostgreSQL reference data for local/VPS testing.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/seed/pg-reference-data.mjs
 *   npm run seed:pg
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pg = require("../../services/shared/node_modules/pg");
import {
  officeRows,
  TRAVELER_STATES,
  vaccineRows,
} from "../../db/seed/reference-data.mjs";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const pool = new pg.Pool({ connectionString: requiredEnv("DATABASE_URL") });

async function upsertOffices(client) {
  const rows = officeRows();
  for (const row of rows) {
    await client.query(
      `INSERT INTO offices (
        id, governorate_id, serial_in_governorate, administration_ar, name_ar,
        address_ar, phone, maps_url, service, active, traveler_state_ids,
        daily_booking_cap, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        governorate_id = EXCLUDED.governorate_id,
        serial_in_governorate = EXCLUDED.serial_in_governorate,
        administration_ar = EXCLUDED.administration_ar,
        name_ar = EXCLUDED.name_ar,
        address_ar = EXCLUDED.address_ar,
        phone = EXCLUDED.phone,
        maps_url = EXCLUDED.maps_url,
        service = EXCLUDED.service,
        active = EXCLUDED.active,
        traveler_state_ids = EXCLUDED.traveler_state_ids,
        updated_at = NOW()`,
      [
        row.id,
        row.governorate_id,
        row.serial_in_governorate,
        row.administration_ar,
        row.name_ar,
        row.address_ar,
        row.phone,
        row.maps_url,
        row.service,
        row.active,
        row.traveler_state_ids,
        row.daily_booking_cap,
      ],
    );
  }
  return rows.length;
}

async function upsertTravelerStates(client) {
  for (const row of TRAVELER_STATES) {
    await client.query(
      `INSERT INTO traveler_states (id, label_ar, sort_order, active, updated_at)
       VALUES ($1, $2, $3, TRUE, NOW())
       ON CONFLICT (id) DO UPDATE SET
         label_ar = EXCLUDED.label_ar,
         sort_order = EXCLUDED.sort_order,
         active = TRUE,
         updated_at = NOW()`,
      [row.id, row.labelAr, row.sortOrder],
    );
  }
  return TRAVELER_STATES.length;
}

async function upsertVaccines(client) {
  const rows = vaccineRows();
  for (const row of rows) {
    await client.query(
      `INSERT INTO vaccines (
        id, category, name_ar, name_en, name_fr, price_egp, free, sort_order, active, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW())
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        name_ar = EXCLUDED.name_ar,
        name_en = EXCLUDED.name_en,
        name_fr = EXCLUDED.name_fr,
        price_egp = EXCLUDED.price_egp,
        free = EXCLUDED.free,
        sort_order = EXCLUDED.sort_order,
        active = TRUE,
        updated_at = NOW()`,
      [
        row.id,
        row.category,
        row.name_ar,
        row.name_en,
        row.name_fr,
        row.price_egp,
        row.free,
        row.sort_order,
      ],
    );
  }
  return rows.length;
}

const client = await pool.connect();
try {
  await client.query("BEGIN");
  const offices = await upsertOffices(client);
  const states = await upsertTravelerStates(client);
  const vaccines = await upsertVaccines(client);
  await client.query("COMMIT");
  console.log(
    `Seeded PostgreSQL: ${offices} offices, ${states} traveler states, ${vaccines} vaccines.`,
  );
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
