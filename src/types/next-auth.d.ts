import NextAuth, { DefaultSession } from "next-auth";

// Định nghĩa mở rộng thêm các trường vào session và user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      status: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    status: string;
  }
}
