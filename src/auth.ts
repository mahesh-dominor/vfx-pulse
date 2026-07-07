import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { authService } from "@/services/auth.service";
import {
  canAccessPath,
  isPublicAuthRoute,
} from "@/features/auth/permissions";

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
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toString();
        const password = credentials.password.toString();

        const user = await authService.validateCredentials(email, password);

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

      if (!canAccessPath(auth.user.role, pathname)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return true;
    },
  },
});