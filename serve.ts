import server from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;

Bun.serve({
  port,
  hostname: "0.0.0.0",
  async fetch(req, bunServer) {
    try {
      return await server.fetch(req);
    } catch (err) {
      console.error("Fetch handler error:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`Server listening on http://0.0.0.0:${port}`);
