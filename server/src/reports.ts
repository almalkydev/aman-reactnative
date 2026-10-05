import { Router } from "express";
import { db } from "./db.js";
import { scope, canRead } from "./auth.js";
import { positiveId, text, uuid, severities, statuses } from "./validation.js";

export const reports = Router();

async function siteAllowed(user: Express.Request["user"], id: unknown) {
  if (!positiveId(id) || (user.role !== "admin" && user.site_id !== id))
    return false;
  return !!(await db.query("SELECT id FROM aman.sites WHERE id=$1", [id]))
    .rowCount;
}
async function photoAllowed(userId: number, url: unknown) {
  if (url === null || url === undefined || url === "") return true;
  if (
    typeof url !== "string" ||
    !/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(url)
  )
    return false;
  return !!(
    await db.query(
      "SELECT filename FROM aman.uploads WHERE filename=$1 AND user_id=$2",
      [url.slice(9), userId],
    )
  ).rowCount;
}
for (const kind of ["inspections", "incidents"] as const) {
  reports.get(`/${kind}`, async (req, res) => {
    const filter = scope(req.user);
    const values: unknown[] = [...filter.values];
    let where = filter.sql;
    if (req.query.status) {
      const allowed =
        kind === "incidents"
          ? statuses
          : ["in_progress", "completed", "failed"];
      if (!allowed.includes(req.query.status as string)) {
        res.status(400).json({ error: "Invalid status." });
        return;
      }
      values.push(req.query.status);
      where += ` AND r.status=$${values.length}`;
    }
    if (kind === "incidents" && req.query.severity) {
      if (!severities.includes(req.query.severity as string)) {
        res.status(400).json({ error: "Invalid severity." });
        return;
      }
      values.push(req.query.severity);
      where += ` AND r.severity=$${values.length}`;
    }
    const extra = kind === "inspections" ? ",t.name AS template_name" : "";
    const join =
      kind === "inspections"
        ? "JOIN aman.templates t ON t.id=r.template_id"
        : "";
    res.json(
      (
        await db.query(
          `SELECT r.*,s.name AS site_name,u.name AS reporter_name${extra} FROM aman.${kind} r JOIN aman.sites s ON s.id=r.site_id JOIN aman.users u ON u.id=r.user_id ${join} WHERE ${where} ORDER BY r.created_at DESC LIMIT 500`,
          values,
        )
      ).rows,
    );
  });
  reports.get(`/${kind}/:id`, async (req, res) => {
    if (!uuid(req.params.id)) {
      res.status(400).json({ error: "Invalid report ID." });
      return;
    }
    const result = await db.query(
      `SELECT r.*,s.name AS site_name,u.name AS reporter_name FROM aman.${kind} r JOIN aman.sites s ON s.id=r.site_id JOIN aman.users u ON u.id=r.user_id WHERE r.id=$1`,
      [req.params.id],
    );
    const row = result.rows[0];
    if (!row || !canRead(req.user, row)) {
      res.status(404).json({ error: "Report not found." });
      return;
    }
    if (kind === "inspections") {
      row.answers = (
        await db.query(
          "SELECT a.*,q.text FROM aman.answers a JOIN aman.questions q ON q.id=a.question_id WHERE inspection_id=$1 ORDER BY q.position",
          [row.id],
        )
      ).rows;
    } else {
      row.photos = (
        await db.query("SELECT url FROM aman.photos WHERE incident_id=$1", [
          row.id,
        ])
      ).rows.map((p) => p.url);
      row.timeline = (
        await db.query(
          "SELECT e.*,u.name FROM aman.incident_events e JOIN aman.users u ON u.id=e.user_id WHERE incident_id=$1 ORDER BY e.created_at",
          [row.id],
        )
      ).rows;
      row.assigned_name = row.assigned_to
        ? (
            await db.query("SELECT name FROM aman.users WHERE id=$1", [
              row.assigned_to,
            ])
          ).rows[0]?.name
        : null;
    }
    res.json(row);
  });
}

reports.post("/inspections", async (req, res) => {
  const b = req.body;
  if (
    !uuid(b.id) ||
    !positiveId(b.template_id) ||
    !text(b.equipment_name, 120) ||
    !Array.isArray(b.answers) ||
    b.answers.some(
      (answer: unknown) => !answer || typeof answer !== "object",
    ) ||
    b.answers.length > 50 ||
    !(await siteAllowed(req.user, b.site_id))
  ) {
    res.status(400).json({
      error: "Choose a valid site, template, equipment name and answers.",
    });
    return;
  }
  const questions = (
    await db.query("SELECT id FROM aman.questions WHERE template_id=$1", [
      b.template_id,
    ])
  ).rows;
  const ids = new Set(questions.map((q) => q.id));
  if (
    !ids.size ||
    b.answers.length !== ids.size ||
    new Set(b.answers.map((a: { question_id: number }) => a.question_id))
      .size !== ids.size
  ) {
    res.status(400).json({ error: "Answer every checklist question once." });
    return;
  }
  for (const a of b.answers) {
    if (
      !a ||
      !ids.has(a.question_id) ||
      !["pass", "fail", "na"].includes(a.result) ||
      typeof a.note !== "string" ||
      a.note.length > 2000 ||
      (a.result === "fail" && !a.note.trim()) ||
      !(await photoAllowed(req.user.id, a.photo_url))
    ) {
      res.status(400).json({
        error:
          "Check your answers. Failed checks need a note and photos must belong to you.",
      });
      return;
    }
  }
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const status = b.answers.some(
      (a: { result: string }) => a.result === "fail",
    )
      ? "failed"
      : "completed";
    const created = await client.query(
      "INSERT INTO aman.inspections(id,template_id,site_id,user_id,equipment_name,status) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING *",
      [
        b.id,
        b.template_id,
        b.site_id,
        req.user.id,
        b.equipment_name.trim(),
        status,
      ],
    );
    if (created.rowCount) {
      for (const a of b.answers)
        await client.query(
          "INSERT INTO aman.answers(inspection_id,question_id,result,note,photo_url) VALUES($1,$2,$3,$4,$5)",
          [b.id, a.question_id, a.result, a.note, a.photo_url || null],
        );
    } else {
      const existing = (
        await client.query("SELECT user_id FROM aman.inspections WHERE id=$1", [
          b.id,
        ])
      ).rows[0];
      if (existing.user_id !== req.user.id) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Report ID already exists." });
        return;
      }
    }
    await client.query("COMMIT");
    res.status(created.rowCount ? 201 : 200).json({ id: b.id, status });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

reports.post("/incidents", async (req, res) => {
  const b = req.body;
  if (
    !uuid(b.id) ||
    !text(b.title, 150) ||
    !text(b.description, 5000) ||
    !text(b.category, 80) ||
    !severities.includes(b.severity) ||
    !(await siteAllowed(req.user, b.site_id)) ||
    !Array.isArray(b.photos) ||
    b.photos.length > 4
  ) {
    res.status(400).json({
      error:
        "Enter a title, description, category, severity and an allowed site. Maximum four photos.",
    });
    return;
  }
  for (const url of b.photos)
    if (!url || !(await photoAllowed(req.user.id, url))) {
      res.status(400).json({ error: "Invalid photo." });
      return;
    }
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const created = await client.query(
      "INSERT INTO aman.incidents(id,user_id,site_id,title,severity,category,description) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING id",
      [
        b.id,
        req.user.id,
        b.site_id,
        b.title.trim(),
        b.severity,
        b.category.trim(),
        b.description.trim(),
      ],
    );
    if (created.rowCount) {
      for (const url of b.photos)
        await client.query(
          "INSERT INTO aman.photos(incident_id,url) VALUES($1,$2)",
          [b.id, url],
        );
      await client.query(
        "INSERT INTO aman.incident_events(incident_id,user_id,text) VALUES($1,$2,'Report created')",
        [b.id, req.user.id],
      );
    } else if (
      (
        await client.query("SELECT user_id FROM aman.incidents WHERE id=$1", [
          b.id,
        ])
      ).rows[0].user_id !== req.user.id
    ) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Report ID already exists." });
      return;
    }
    await client.query("COMMIT");
    res.status(created.rowCount ? 201 : 200).json({ id: b.id });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

reports.patch("/incidents/:id", async (req, res) => {
  if (req.user.role === "worker") {
    res.status(403).json({ error: "A supervisor is required." });
    return;
  }
  if (!uuid(req.params.id)) {
    res.status(400).json({ error: "Invalid report ID." });
    return;
  }
  const b = req.body;
  if (
    (b.status !== undefined && !statuses.includes(b.status)) ||
    (b.assigned_to !== undefined &&
      b.assigned_to !== null &&
      !positiveId(b.assigned_to)) ||
    (b.status === undefined && b.assigned_to === undefined)
  ) {
    res.status(400).json({ error: "Choose a valid status or assignee." });
    return;
  }
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const row = (
      await client.query(
        "SELECT * FROM aman.incidents WHERE id=$1 FOR UPDATE",
        [req.params.id],
      )
    ).rows[0];
    if (!row || !canRead(req.user, row)) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Report not found." });
      return;
    }
    if (b.assigned_to) {
      const assignee = (
        await client.query(
          "SELECT id FROM aman.users WHERE id=$1 AND (site_id=$2 OR role='admin')",
          [b.assigned_to, row.site_id],
        )
      ).rows[0];
      if (!assignee) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Assignee must belong to this site." });
        return;
      }
    }
    const result = await client.query(
      "UPDATE aman.incidents SET status=$1,assigned_to=$2 WHERE id=$3 RETURNING *",
      [
        b.status ?? row.status,
        b.assigned_to === undefined ? row.assigned_to : b.assigned_to,
        row.id,
      ],
    );
    const events: string[] = [];
    if (b.status !== undefined && b.status !== row.status)
      events.push(`Status changed to ${b.status}`);
    if (b.assigned_to !== undefined && b.assigned_to !== row.assigned_to)
      events.push(
        b.assigned_to === null ? "Assignment removed" : "Report assigned",
      );
    for (const event of events)
      await client.query(
        "INSERT INTO aman.incident_events(incident_id,user_id,text) VALUES($1,$2,$3)",
        [row.id, req.user.id, event],
      );
    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
