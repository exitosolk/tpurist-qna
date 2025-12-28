import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
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
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists by email
          const existingUser = await query(
            "SELECT * FROM users WHERE email = ?",
            [user.email]
          );

          if (existingUser.rows.length === 0) {
            // Generate unique username from email
            let baseUsername = user.email?.split("@")[0] || `user_${Date.now()}`;
            let username = baseUsername;
            let counter = 1;
            
            // Check if username exists and make it unique
            while (true) {
              const usernameCheck = await query(
                "SELECT id FROM users WHERE username = ?",
                [username]
              );
              if (usernameCheck.rows.length === 0) break;
              username = `${baseUsername}${counter}`;
              counter++;
            }
            
            const displayName = user.name || username;
            
            // OAuth users don't have passwords - use a placeholder
            const placeholderPassword = await bcrypt.hash(`oauth_${Date.now()}_${Math.random()}`, 10);
            
            // OAuth users get verified email and reputation bonus (10 points - same as email verification)
            const result = await query(
              `INSERT INTO users (username, email, password_hash, display_name, avatar_url, email_verified, reputation, email_verification_bonus_awarded, created_at) 
               VALUES (?, ?, ?, ?, ?, TRUE, 10, TRUE, NOW())`,
              [username, user.email, placeholderPassword, displayName, user.image]
            );

            user.id = result.insertId?.toString() || "";
          } else {
            // User exists, use existing ID
            user.id = existingUser.rows[0].id.toString();
            
            // Update avatar and display name if changed
            if (user.image || user.name) {
              await query(
                "UPDATE users SET avatar_url = ?, display_name = ? WHERE id = ?",
                [user.image, user.name, user.id]
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
      if (session.user && token.sub) {
        session.user.id = token.sub;
        
        // Fetch fresh user data from database
        try {
          const result = await query(
            "SELECT id, email, username, display_name, avatar_url FROM users WHERE id = ?",
            [token.sub]
          );
          
          if (result.rows.length > 0) {
            const dbUser = result.rows[0];
            session.user.email = dbUser.email;
            session.user.name = dbUser.display_name || dbUser.username;
            session.user.image = dbUser.avatar_url;
          }
        } catch (error) {
          console.error("Session fetch error:", error);
        }
      }
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      // On sign in, set the user ID in the token
      if (user) {
        token.sub = user.id;
      }
      
      // On subsequent requests, verify user still exists
      if (trigger === "update" && token.sub) {
        try {
          const result = await query(
            "SELECT id FROM users WHERE id = ?",
            [token.sub]
          );
          
          if (result.rows.length === 0) {
            // User was deleted, invalidate token
            return {};
          }
        } catch (error) {
          console.error("JWT validation error:", error);
        }
      }
      
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login on error
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
};
