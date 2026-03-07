import server from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;

const s = Bun.serve({
  port,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/healthz") {
      return new Response("ok");
    }
    try {
      return await server.fetch(req);
    } catch (err) {
      console.error("Fetch handler error:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`Server listening on http://0.0.0.0:${s.port}`);

// Heartbeat to verify process stays alive
setInterval(() => {
  console.log(`[heartbeat] alive at ${new Date().toISOString()}`);
}, 30_000);
