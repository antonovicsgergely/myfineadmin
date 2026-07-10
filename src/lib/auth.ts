import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Jelszó", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Hiányzó email vagy jelszó");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Hibás email vagy jelszó");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Hibás email vagy jelszó");
        }

        // Check if vendor is approved, unless they are SUPERADMIN or ADMIN
        if (user.role === "VENDOR") {
          const vendor = await prisma.vendor.findUnique({
            where: { userId: user.id },
          });

          if (vendor && vendor.status !== "APPROVED") {
            throw new Error("A fiókod még jóváhagyásra vár, vagy elutasításra került.");
          }
        }

        // Record last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.image as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 óra — utána újra kell jelentkezni
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// 🔒 Induláskor ellenőrizzük, hogy a secret be van-e állítva.
// Ha nincs, a szerver NE induljon el, mert a JWT tokenek hamisíthatóvá válnának.
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "NEXTAUTH_SECRET környezeti változó nincs beállítva! " +
    "Állítsd be az .env fájlban egy erős, véletlenszerű értékkel."
  );
}

