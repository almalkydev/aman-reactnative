import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { validSuggestion } from "../src/validation.js";
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const address = server.address() as { port: number };
const base = `http://127.0.0.1:${address.port}`;
const created: string[] = [];
const uploads: string[] = [];
async function request(
  url: string,
  token = "",
  method = "GET",
  body?: unknown,
) {
  const response = await fetch(base + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
async function login(role: string) {
  const result = await request("/auth/login", "", "POST", {
    email: `${role}@aman.demo`,
    password: "AmanDemo2026!",
  });
  assert.equal(result.status, 200);
  assert.ok(!result.data.user.password_hash);
  return result.data.token as string;
}
after(async () => {
  for (const id of created) {
    await db.query("DELETE FROM aman.incidents WHERE id=$1", [id]);
    await db.query("DELETE FROM aman.inspections WHERE id=$1", [id]);
  }
  for (const url of uploads) {
    await db.query("DELETE FROM aman.uploads WHERE filename=$1", [
      url.slice(9),
    ]);
    await unlink(path.resolve("uploads", url.slice(9)));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await db.end();
});
test("API supports field workflows and enforces role boundaries", async () => {
  assert.equal((await request("/me")).status, 401);
  assert.equal((await request('/auth/login','','POST',null)).status,400);
  assert.equal(
    (
      await request("/auth/login", "", "POST", {
        email: "worker@aman.demo",
        password: "wrong",
      })
    ).status,
    401,
  );
  const worker = await login("worker"),
    supervisor = await login("supervisor"),
    admin = await login("admin");
  assert.equal((await request("/me", worker)).data.role, "worker");
  assert.equal((await request("/sites", worker)).data.length, 1);
  assert.equal((await request("/sites", admin)).data.length, 2);
  assert.equal((await request("/templates", worker)).data.length, 3);
  const questions = (await request("/templates/1/questions", worker)).data;
  assert.equal(questions.length, 9);
  assert.equal((await request("/users", worker)).status, 403);
  assert.ok((await request("/users", supervisor)).data.length >= 2);
  const dashboard = await request("/dashboard", worker);
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.data.days.length, 7);
  for (const kind of ["inspections", "incidents"]) {
    const list = await request("/" + kind, worker);
    assert.equal(list.status, 200);
    assert.ok(list.data.every((r: { user_id: number }) => r.user_id === 1));
    assert.equal(
      (await request(`/${kind}/${list.data[0].id}`, worker)).status,
      200,
    );
    assert.equal(
      (await request(`/${kind}?status=invalid`, worker)).status,
      400,
    );
  }
  const id = randomUUID();
  created.push(id);
  const draft = {
    id,
    title: "Integration test observation",
    severity: "medium",
    category: "Equipment",
    description: "Sample data created by automated verification.",
    site_id: 1,
    photos: [] as string[],
  };
  assert.equal(
    (await request("/incidents", worker, "POST", { ...draft, site_id: 2 }))
      .status,
    400,
  );
  assert.equal(
    (
      await request("/incidents", worker, "POST", {
        ...draft,
        severity: "urgent",
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("/incidents", worker, "POST", draft)).status,
    201,
  );
  assert.equal(
    (await request("/incidents", worker, "POST", draft)).status,
    200,
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS count FROM aman.incidents WHERE id=$1",
        [id],
      )
    ).rows[0].count,
    1,
  );
  assert.equal(
    (await request(`/incidents/${id}`, worker, "PATCH", { status: "closed" }))
      .status,
    403,
  );
  assert.equal(
    (
      await request(`/incidents/${id}`, supervisor, "PATCH", {
        status: "in_progress",
        assigned_to: 2,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/incidents/${id}`, supervisor, "PATCH", {
        status: "closed",
      })
    ).status,
    200,
  );
  assert.equal(
    (await request(`/incidents/${id}`, worker)).data.status,
    "closed",
  );
  const foreign = randomUUID();
  created.push(foreign);
  assert.equal(
    (
      await request("/incidents", admin, "POST", {
        ...draft,
        id: foreign,
        site_id: 2,
      })
    ).status,
    201,
  );
  assert.equal((await request(`/incidents/${foreign}`, worker)).status, 404);
  assert.equal(
    (
      await request(`/incidents/${foreign}`, supervisor, "PATCH", {
        status: "closed",
      })
    ).status,
    404,
  );
  assert.equal(
    (await request("/incidents", worker, "POST", { ...draft, id: foreign }))
      .status,
    409,
  );
  const inspectionId = randomUUID();
  created.push(inspectionId);
  const inspection = {
    id: inspectionId,
    template_id: 1,
    site_id: 1,
    equipment_name: "Test P-101",
    answers: questions.map((q: { id: number }) => ({
      question_id: q.id,
      result: "pass",
      note: "",
    })),
  };
  assert.equal(
    (
      await request("/inspections", worker, "POST", {
        ...inspection,
        answers: inspection.answers.slice(1),
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("/inspections", worker, "POST", inspection)).status,
    201,
  );
  assert.equal(
    (await request("/inspections", worker, "POST", inspection)).status,
    200,
  );
  assert.equal(
    (await request(`/inspections/${inspectionId}`, worker)).data.answers.length,
    9,
  );
  const failId = randomUUID();
  created.push(failId);
  inspection.answers[0] = {
    ...inspection.answers[0],
    result: "fail",
    note: "",
  };
  assert.equal(
    (
      await request("/inspections", worker, "POST", {
        ...inspection,
        id: failId,
      })
    ).status,
    400,
  );
  inspection.answers[0].note = "Visible seal damage.";
  assert.equal(
    (
      await request("/inspections", worker, "POST", {
        ...inspection,
        id: failId,
      })
    ).data.status,
    "failed",
  );
  const fake = new FormData();
  fake.append("photo", new Blob(["fake"], { type: "image/png" }), "fake.png");
  assert.equal(
    (
      await fetch(base + "/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${worker}` },
        body: fake,
      })
    ).status,
    400,
  );
  const image = new FormData();
  image.append(
    "photo",
    new Blob(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
          "base64",
        ),
      ],
      { type: "image/png" },
    ),
    "sample.png",
  );
  const uploaded = await fetch(base + "/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${worker}` },
    body: image,
  });
  assert.equal(uploaded.status, 201);
  const url = ((await uploaded.json()) as { url: string }).url;
  uploads.push(url);
  assert.equal((await fetch(base + url)).status, 401);
  assert.equal(
    (
      await fetch(base + url, {
        headers: { Authorization: `Bearer ${supervisor}` },
      })
    ).status,
    404,
  );
  const photoId = randomUUID();
  created.push(photoId);
  assert.equal(
    (
      await request("/incidents", worker, "POST", {
        ...draft,
        id: photoId,
        photos: [url],
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await fetch(base + url, {
        headers: { Authorization: `Bearer ${supervisor}` },
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("/incidents/suggest", worker, "POST", { description: "" }))
      .status,
    400,
  );
  if (!process.env.ANTHROPIC_API_KEY)
    assert.equal(
      (
        await request("/incidents/suggest", worker, "POST", {
          description: "Sample leak at valve.",
        })
      ).status,
      503,
    );
  assert.equal(
    (
      await fetch(base + "/me", {
        headers: {
          Origin: "https://untrusted.example",
          Authorization: `Bearer ${worker}`,
        },
      })
    ).status,
    403,
  );
});
test("AI output validation rejects malformed or unsupported values", () => {
  assert.equal(validSuggestion(null), false);
  assert.equal(
    validSuggestion({
      category: "Equipment",
      suggested_severity: "urgent",
      suggested_team: "Maintenance",
    }),
    false,
  );
  assert.equal(
    validSuggestion({
      category: "Equipment",
      suggested_severity: "high",
      suggested_team: "Maintenance",
    }),
    true,
  );
});
