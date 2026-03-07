import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth, type Session } from "./auth.js";

export const getServerSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<Session | null> => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    return session;
  },
);

export const requireAdmin = createServerFn({ method: "GET" }).handler(
  async (): Promise<Session> => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    return session;
  },
);

export const requireMember = createServerFn({ method: "GET" }).handler(
  async (): Promise<Session> => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      throw new Error("Unauthorized");
    }
    return session;
  },
);
