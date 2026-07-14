import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { authService } from "@/services/auth.service";
import {
  isPublicAuthRoute,
  normalizeProtectedPath,
} from "@/features/auth/permissions";
import { canAccessPath } from "@/features/auth/rbac";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

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

      if (!auth?.user?.role) {
        return false;
      }

      if (!auth.user.id) {
        return false;
      }

      const normalizedPath = normalizeProtectedPath(pathname);

      return canAccessPath(auth.user.id, auth.user.role, normalizedPath).then((allowed) => {
        if (!allowed) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        return true;
      });
    },
  },
});