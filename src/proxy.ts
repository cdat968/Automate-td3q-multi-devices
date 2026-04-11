import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
    // Lấy JWT token từ cookie (với next-auth/jwt có thể access ngay tại Edge runtime).
    // Biến NEXTAUTH_SECRET bắt buộc phải có trong .env để mã hóa JWT.
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // console.log("Middleware check - Token:", token);
    const { pathname } = req.nextUrl;

    // Nếu người dùng thử vào trang / không có đuôi gì cả, hoặc trang ngoài -> ta bỏ qua?
    // User có require khi "truy cập trực tiếp vào /home mà chưa login thì phải redirect về /login"

    // 1. Nhóm Route công khai: Những page Auth này dành cho người CHƯA ĐĂNG NHẬP.
    // Nếu đã đăng nhập thì tự động đá văng về /home (chống truy cập bằng tay url).
    const isAuthRoute = ["/login", "/register", "/verify-email"].some((route) =>
        pathname.startsWith(route),
    );

    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    // 2. Nhóm Route bắt buộc bảo vệ: Những page Private dành cho người ĐÃ ĐĂNG NHẬP.
    // Nếu chưa đăng nhập thì đẩy về trang /login thẳng thừng.
    const isProtectedRoute = [
        "/home",
        "/dashboard",
        "/settings",
        "/devices",
    ].some((route) => pathname.startsWith(route));

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Nếu truy cập root "/" => mặc định đẩy về /home (và từ home sẽ qua các bộ lọc phía trên)
    if (pathname === "/") {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    // Chấp nhận truy cập cho tất cả các đường dẫn phù hợp (như API public, webhook...)
    return NextResponse.next();
}

// 3. Matcher: Chặn middleware không kích hoạt bừa bãi
// ở các tệp tĩnh đồ họa (_next/static), API routes, hoặc file hệ thống của next.
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
