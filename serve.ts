import server from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;

Bun.serve({
  port,
  hostname: "0.0.0.0",
  fetch: server.fetch,
});

console.log(`Server listening on http://0.0.0.0:${port}`);
