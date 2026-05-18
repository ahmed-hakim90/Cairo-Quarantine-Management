/**
 * Optional one-time migration: Firestore reference data → PostgreSQL.
 * Does not migrate requests/queue (use VPS cutover + new traffic).
 *
 * Requires Firebase Admin + DATABASE_URL.
 *
 *   npm run migrate:firestore-to-pg
 */

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "node:module";
import {
  officeRows,
  TRAVELER_STATES,
  vaccineRows,
} from "../../db/seed/reference-data.mjs";

const require = createRequire(import.meta.url);
const pg = require("../../services/shared/node_modules/pg");

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

initializeApp({
  credential: cert({
    projectId: requiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const pool = new pg.Pool({ connectionString: requiredEnv("DATABASE_URL") });

function deriveTravelerStateIds(data) {
  const raw = data.travelerStateIds;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map(String).filter(Boolean);
  }
  const service = data.service === "hajj_umrah_only" ? "hajj_umrah_only" : "hajj_umrah_travelers";
  if (service === "hajj_umrah_only") return ["hajj_umrah", "citizen"];
  return ["international", "hajj_umrah", "citizen"];
}

async function migrateOffices(client) {
  const snap = await db.collection("offices").get();
  let count = 0;
  if (snap.empty) {
    for (const row of officeRows()) {
      await upsertOffice(client, row);
      count += 1;
    }
    console.log(`Offices: no Firestore docs; seeded ${count} static rows.`);
    return count;
  }
  for (const doc of snap.docs) {
    const data = doc.data();
    await upsertOffice(client, {
      id: doc.id,
      governorate_id: String(data.governorateId ?? "cairo"),
      serial_in_governorate: Number(data.serialInGovernorate ?? 9999),
      administration_ar: String(data.administrationAr ?? ""),
      name_ar: String(data.nameAr ?? ""),
      address_ar: String(data.addressAr ?? ""),
      phone: data.phone ?? null,
      maps_url: String(data.mapsUrl ?? ""),
      service:
        data.service === "hajj_umrah_only" ? "hajj_umrah_only" : "hajj_umrah_travelers",
      active: data.active !== false,
      traveler_state_ids: deriveTravelerStateIds(data),
      daily_booking_cap:
        typeof data.dailyBookingCap === "number" && data.dailyBookingCap > 0
          ? data.dailyBookingCap
          : null,
    });
    count += 1;
  }
  console.log(`Offices: migrated ${count} from Firestore.`);
  return count;
}

async function upsertOffice(client, row) {
  await client.query(
    `INSERT INTO offices (
      id, governorate_id, serial_in_governorate, administration_ar, name_ar,
      address_ar, phone, maps_url, service, active, traveler_state_ids,
      daily_booking_cap, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
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
      daily_booking_cap = EXCLUDED.daily_booking_cap,
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

async function migrateTravelerStates(client) {
  const snap = await db.collection("traveler_states").get();
  const rows =
    snap.empty
      ? TRAVELER_STATES
      : snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            labelAr: String(data.labelAr ?? doc.id),
            sortOrder: Number(data.sortOrder ?? 0),
          };
        });
  for (const row of rows) {
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
  console.log(`Traveler states: ${rows.length}`);
  return rows.length;
}

async function migrateVaccines(client) {
  const snap = await db.collection("vaccines").get();
  if (snap.empty) {
    const rows = vaccineRows();
    for (const row of rows) {
      await upsertVaccine(client, row);
    }
    console.log(`Vaccines: no Firestore docs; seeded ${rows.length} static rows.`);
    return rows.length;
  }
  let count = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    await upsertVaccine(client, {
      id: doc.id,
      category: String(data.category ?? "citizen"),
      name_ar: String(data.nameAr ?? ""),
      name_en: String(data.nameEn ?? ""),
      name_fr: String(data.nameFr ?? ""),
      price_egp:
        data.free === true
          ? null
          : typeof data.priceEgp === "number"
            ? data.priceEgp
            : null,
      free: data.free === true,
      sort_order: Number(data.sortOrder ?? count),
    });
    count += 1;
  }
  console.log(`Vaccines: migrated ${count} from Firestore.`);
  return count;
}

async function upsertVaccine(client, row) {
  await client.query(
    `INSERT INTO vaccines (
      id, category, name_ar, name_en, name_fr, price_egp, free, sort_order, active, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,NOW())
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

async function migrateAppSettings(client) {
  const snap = await db.collection("settings").doc("app").get();
  const cutoff =
    snap.exists && typeof snap.data()?.bookingSameDayCutoffHour === "number"
      ? snap.data().bookingSameDayCutoffHour
      : 14;
  await client.query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ('app', $1::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify({ bookingSameDayCutoffHour: cutoff })],
  );
  console.log(`App settings: bookingSameDayCutoffHour=${cutoff}`);
}

const client = await pool.connect();
try {
  await client.query("BEGIN");
  await migrateOffices(client);
  await migrateTravelerStates(client);
  await migrateVaccines(client);
  await migrateAppSettings(client);
  await client.query("COMMIT");
  console.log("Firestore → PostgreSQL reference migration complete.");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
