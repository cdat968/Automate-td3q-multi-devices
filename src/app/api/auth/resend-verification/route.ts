import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndSendVerification } from "@/services/verification.service";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Thiếu địa chỉ email" }, { status: 400 });
    }

    // 1. Kiểm tra user có tồn tại và đang PENDING
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản tương ứng với email này" },
        { status: 404 }
      );
    }

    if (user.status !== "PENDING" || user.emailVerified) {
      return NextResponse.json(
        { message: "Tài khoản này đã được kích hoạt. Bạn có thể đăng nhập." },
        { status: 400 } // Technically bad request if they ask for resend on active account
      );
    }

    // 2. Xoá gọn token cũ đi trước khi sinh token mới
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 3. Tiến hành Sinh token mới & gửi mail bằng Service đã tái cấu trúc
    await generateAndSendVerification(email);

    return NextResponse.json(
      { message: "Email kích hoạt đã được gửi thành công!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend Verification Error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi nội bộ trên máy chủ." },
      { status: 500 }
    );
  }
}
