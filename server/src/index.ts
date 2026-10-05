import { app } from "./app.js";
import { db } from "./db.js";
await db.query("SELECT 1");
const server = app.listen(Number(process.env.PORT) || 4000, "0.0.0.0", () =>
  process.stdout.write(
    "Aman API listening on port " + (process.env.PORT || 4000) + "\n",
  ),
);
process.on("SIGINT", () => {
  server.close(() => {
    void db.end();
  });
});
