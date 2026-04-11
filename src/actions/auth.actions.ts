"use server";

import { verifyEmailToken } from "@/services/verification.service";
import { AuthError, VerifyState } from "@/types/auth.types";

/**
 * Server Action dùng cho Client Component để kiểm tra verify token
 * Trả về 1 trạng thái giao diện UI, không throw error gây sập trang.
 */
export async function verifyAccountAction(token: string): Promise<VerifyState> {
  if (!token) {
    return "VERIFY_TOKEN_INVALID";
  }

  try {
    const status = await verifyEmailToken(token);
    
    // Nếu token trả về mã ACCOUNT_PENDING có nghĩa là code trong service
    // thông báo "Đã verify trước đó rồi" (Already verified).
    if (status === AuthError.ACCOUNT_PENDING) {
      return "VERIFY_ALREADY_COMPLETED";
    }

    return "VERIFY_SUCCESS";

  } catch (error: any) {
    const errMessage = error.message;

    if (errMessage === AuthError.TOKEN_EXPIRED) {
      return "VERIFY_TOKEN_EXPIRED";
    }
    if (errMessage === AuthError.TOKEN_INVALID) {
      return "VERIFY_TOKEN_INVALID";
    }

    // Các lỗi khác như DB mất kết nối hoặc user bị xoá
    console.error("Action verify error:", error);
    return "VERIFY_SERVER_ERROR";
  }
}
