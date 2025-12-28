import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const result = await query(
            "SELECT * FROM users WHERE email = ?",
            [credentials.email]
          );

          const user = result.rows[0];

          if (!user) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.display_name || user.username,
            image: user.avatar_url,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Check if user exists by email
          const existingUser = await query(
            "SELECT * FROM users WHERE email = ?",
            [user.email]
          );

          if (existingUser.rows.length === 0) {
            // Create new user for OAuth sign-in
            const username = user.email?.split("@")[0] || `user_${Date.now()}`;
            const displayName = user.name || username;
            
            const result = await query(
              `INSERT INTO users (username, email, display_name, avatar_url, email_verified, created_at) 
               VALUES (?, ?, ?, ?, 1, NOW())`,
              [username, user.email, displayName, user.image]
            );

            user.id = result.insertId?.toString() || "";
          } else {
            // User exists, use existing ID
            user.id = existingUser.rows[0].id.toString();
            
            // Update avatar if changed
            if (user.image) {
              await query(
                "UPDATE users SET avatar_url = ? WHERE id = ?",
                [user.image, user.id]
              );
            }
          }
        } catch (error) {
          console.error("OAuth sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
