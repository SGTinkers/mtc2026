import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { auth, type Session } from "./auth.js";

export const getServerSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<Session | null> => {
    const request = getWebRequest();
    if (!request) return null;
    const session = await auth.api.getSession({ headers: request.headers });
    return session;
  },
);

export const requireAdmin = createServerFn({ method: "GET" }).handler(
  async (): Promise<Session> => {
    const request = getWebRequest();
    if (!request) throw new Error("Unauthorized");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    return session;
  },
);

export const requireMember = createServerFn({ method: "GET" }).handler(
  async (): Promise<Session> => {
    const request = getWebRequest();
    if (!request) throw new Error("Unauthorized");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      throw new Error("Unauthorized");
    }
    return session;
  },
);
