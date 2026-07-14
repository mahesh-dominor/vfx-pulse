import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { authService } from "@/services/auth.service";
import {
  isPublicAuthRoute,
  normalizeProtectedPath,
} from "@/features/auth/permissions";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Auth.js v5 automatically reads AUTH_SECRET from process.env at runtime.
  // Do NOT set secret: process.env.AUTH_SECRET here — that captures the value
  // at build time. Just ensure AUTH_SECRET is set in Vercel env vars.
  trustHost: true,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        identifier: {
          label: "Email or Username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.identifier || !credentials?.password) {
            console.warn("[auth] Missing credentials in authorize callback");
            return null;
          }

          const identifier = credentials.identifier.toString();
          const password = credentials.password.toString();

          const user = await authService.validateCredentials(identifier, password);

          if (!user) {
            console.warn(`[auth] Invalid credentials for identifier: ${identifier}`);
            return null;
          }

          console.log(`[auth] Authorized user: ${user.email} (${user.role})`);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("[auth] authorize() threw error:", error);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.role = user.role;
        }
        return token;
      } catch (error) {
        console.error("[auth] jwt() callback threw error:", error);
        throw error;
      }
    },

    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.sub ?? "";
          session.user.role = token.role as UserRole;
        }
        return session;
      } catch (error) {
        console.error("[auth] session() callback threw error:", error);
        throw error;
      }
    },

    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;

      if (isPublicAuthRoute(pathname)) {
        if (auth?.user) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return true;
      }

      // Require a valid session. Fine-grained RBAC is enforced in each route/page.
      if (!auth?.user?.id || !auth?.user?.role) {
        return false;
      }

      return true;
    },
  },
});