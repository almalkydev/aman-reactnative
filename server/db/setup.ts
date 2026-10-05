import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../src/db.js";

const client = await db.connect();
try {
  await client.query("BEGIN");
  await client.query(
    await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
  );
  await client.query(
    await readFile(new URL("./seed.sql", import.meta.url), "utf8"),
  );
  const password = await bcrypt.hash("AmanDemo2026!", 12);
  for (const [id, name, role] of [
    [1, "Salim Al Balushi", "worker"],
    [2, "Noor Al Harthy", "supervisor"],
    [3, "Amal Al Hinai", "admin"],
  ] as const) {
    await client.query(
      "INSERT INTO users(id,name,email,password_hash,role,site_id) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT DO NOTHING",
      [id, name, `${role}@aman.demo`, password, role],
    );
  }
  const existing = await client.query("SELECT id FROM inspections LIMIT 1");
  if (!existing.rowCount) {
    const titles = [
      "Valve seal needs replacement",
      "Walkway obstruction near unit B",
      "Unsecured cable at pump skid",
      "Missing extinguisher inspection tag",
      "Minor oil seepage at flange",
      "Damaged handrail on access platform",
      "Pressure gauge outside normal range",
    ];
    for (let i = 0; i < 21; i++) {
      const site = i % 4 === 0 ? 2 : 1;
      const template = (i % 3) + 1;
      const id = randomUUID();
      const status = i % 5 === 0 ? "failed" : "completed";
      await client.query(
        "INSERT INTO inspections VALUES($1,$2,$3,$4,$5,$6,now()-make_interval(days=>$7,hours=>$8))",
        [
          id,
          template,
          site,
          site === 2 ? 3 : 1,
          `Pump ${String(i + 101)}`,
          status,
          i % 7,
          i % 6,
        ],
      );
      await client.query(
        "INSERT INTO answers(inspection_id,question_id,result,note) SELECT $1,id,CASE WHEN position=4 AND $3='failed' THEN 'fail' ELSE 'pass' END,CASE WHEN position=4 AND $3='failed' THEN 'Visible wear observed; supervisor notified.' ELSE '' END FROM questions WHERE template_id=$2",
        [id, template, status],
      );
      const incident = randomUUID();
      await client.query(
        "INSERT INTO incidents(id,user_id,site_id,title,severity,category,description,status,assigned_to,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$11,now()-make_interval(days=>$9,hours=>$10))",
        [
          incident,
          site === 2 ? 3 : 1,
          site,
          titles[i % 7],
          ["low", "medium", "high", "critical"][i % 4],
          ["Equipment", "Housekeeping", "Electrical", "Fire safety"][i % 4],
          "Sample observation from a routine site walk. Area made safe and supervisor informed. Follow-up inspection required.",
          ["open", "in_progress", "closed"][i % 3],
          i % 7,
          i % 6,
          site === 2 ? 3 : 2,
        ],
      );
      await client.query(
        "INSERT INTO incident_events(incident_id,user_id,text) VALUES($1,1,'Report created · sample data')",
        [incident],
      );
    }
  }
  await client.query("COMMIT");
  process.stdout.write("Aman schema and demo data are ready.\n");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await db.end();
}
