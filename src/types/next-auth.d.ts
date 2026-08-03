import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OWNER" | "ADMIN" | "STAFF" | "PLATFORM_ADMIN";
      tenantId: string;
      tenantSlug: string;
      tenantName: string;
      tenantPlan: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "OWNER" | "ADMIN" | "STAFF" | "PLATFORM_ADMIN";
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    tenantPlan: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "OWNER" | "ADMIN" | "STAFF" | "PLATFORM_ADMIN";
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    tenantPlan: string;
  }
}
