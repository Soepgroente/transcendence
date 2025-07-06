import { FastifyPluginAsync } from "fastify";
import fetch from "node-fetch";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(require("@fastify/oauth2"), {
    name: "googleOAuth2",
    scope: ["profile", "email"],
    credentials: {
        client: {
        id: process.env.GOOGLE_CLIENT_ID!,
        secret: process.env.GOOGLE_CLIENT_SECRET!,
        },

      auth: require("@fastify/oauth2").GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/auth/google",
    callbackUri: "http://localhost:3000/auth/callback",
  });

  fastify.get("/auth/callback", async function (request, reply) {
    const token = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${token.token.access_token}`,
      },
    });
    const user = await userRes.json();
    return reply.send(user);
  });
};

export default authRoutes;
