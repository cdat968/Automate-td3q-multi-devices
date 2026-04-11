import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail.service";
import { AuthError } from "@/types/auth.types";

/**
 * Tạo token ngẫu nhiên, lưu vào DB và gọi mail service gửi link
 */
export async function generateAndSendVerification(
    email: string,
): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 1000);

    // 1. Lưu token vào CSDL
    await prisma.verificationToken.create({
        data: {
            identifier: email,
            token: rawToken,
            expires: expires,
        },
    });

    // 2. Gửi email
    const verifyUrl = `/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

    try {
        await sendVerificationEmail(email, verifyUrl);
    } catch (mailError) {
        console.error("Failed to send verification email:", mailError);
        // Vẫn pass để account tạo thành công, có thể resend sau
    }
}

/**
 * Verify token và cập nhật trạng thái User
 */
export async function verifyEmailToken(token: string): Promise<string> {
    if (!token) throw new Error(AuthError.TOKEN_INVALID);

    const verificationToken = await prisma.verificationToken.findFirst({
        where: { token },
    });

    if (!verificationToken) {
        throw new Error(AuthError.TOKEN_INVALID);
    }

    const hasExpired = new Date(verificationToken.expires) < new Date();

    // Dù hết hạn hay hợp lệ cũng xoá token rác để tránh reuse an toàn hơn (hoặc tái trigger)
    // Xoá ngay lúc check lỗi hết hạn.
    if (hasExpired) {
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: verificationToken.identifier,
                    token: verificationToken.token,
                },
            },
        });
        throw new Error(AuthError.TOKEN_EXPIRED);
    }

    const existingUser = await prisma.user.findUnique({
        where: { email: verificationToken.identifier },
    });

    if (!existingUser) {
        throw new Error(AuthError.INTERNAL_ERROR); // Or user_not_found
    }

    if (existingUser.emailVerified) {
        return AuthError.ACCOUNT_PENDING; // Already checked? No, returning something meaning 'already verified'
        // Actually if they are already verified, we shouldn't throw error but return success.
    }

    // Update Status
    await prisma.$transaction([
        prisma.user.update({
            where: { email: verificationToken.identifier },
            data: {
                emailVerified: new Date(),
                status: "ACTIVE", // Business Logic Rule
            },
        }),
        prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: verificationToken.identifier,
                    token: verificationToken.token,
                },
            },
        }),
    ]);

    return "VERIFIED_SUCCESSFUL";
}
