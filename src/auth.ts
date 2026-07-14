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
  // AUTH_SECRET must be set in Vercel env vars before the build runs.
  // The build process on Vercel injects it, so capturing it here (at build time)
  // is safe and required for Auth.js v5 to have a secret at runtime.
  secret: process.env.AUTH_SECRET,
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
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const identifier = credentials.identifier.toString();
        const password = credentials.password.toString();

        const user = await authService.validateCredentials(identifier, password);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as UserRole;
      }

      return session;
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