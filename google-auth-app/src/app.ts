import fastify from "fastify";
import path from "path";
import fastifyStatic from "@fastify/static";

const app = fastify();

// Register the static plugin BEFORE your routes
app.register(fastifyStatic, {
  root: path.join(__dirname, ".."),
  prefix: "/", // optional
});

// Then define routes
app.get("/", async (_, reply) => {
  return reply.type("text/html").sendFile("index.html");
});

// Start server
app.listen({ port: 3000, host: "0.0.0.0" }, err => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Server running on http://localhost:3000");
});
