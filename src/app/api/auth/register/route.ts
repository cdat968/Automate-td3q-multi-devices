import { NextResponse } from "next/server";
import { registerUser } from "@/services/auth.service";
import { generateAndSendVerification } from "@/services/verification.service";
import { AuthError } from "@/types/auth.types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword } = body;

    // 1. Validation cơ bản
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // 2. Delegate to Service for Business Logic
    const newUser = await registerUser(name, email, password);

    // 3. Delegate to Verification Service
    await generateAndSendVerification(email);

    return NextResponse.json(
      { message: "Account created successfully. Please check your email to verify.", user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === AuthError.EMAIL_TAKEN) {
      return NextResponse.json(
        { error: "Email already taken" },
        { status: 409 }
      );
    }

    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
