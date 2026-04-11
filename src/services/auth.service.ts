import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AuthError } from "@/types/auth.types";

export async function registerUser(name: string, email: string, password: string) {
  // 1. Normalize
  const normalizedName = name.trim();
  const normalizedEmail = email.toLowerCase().trim();

  // 2. Check exist
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error(AuthError.EMAIL_TAKEN);
  }

  // 3. Hash
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 4. Create User
  const newUser = await prisma.user.create({
    data: {
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: "USER",
      status: "PENDING", // MUST verify email to login
      emailVerified: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return newUser;
}
