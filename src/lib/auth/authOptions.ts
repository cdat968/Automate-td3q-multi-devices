import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "@/types/auth.types";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error(AuthError.INVALID_CREDENTIALS);
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.passwordHash) {
                    throw new Error(AuthError.INVALID_CREDENTIALS);
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash,
                );

                if (!isPasswordValid) {
                    throw new Error(AuthError.INVALID_CREDENTIALS);
                }

                // Không kiểm tra status ở đây nữa. Uỷ quyền cho `signIn` callback để tái sử dụng
                if (user.lockedUntil && user.lockedUntil > new Date()) {
                    // You could also move this to signIn callback if user is fetched there,
                    // but blocked login attempts are fine here for credentials specifically.
                    throw new Error("ERR_ACCOUNT_LOCKED");
                }

                // Feature 3: Ghi nhận UserDeviceSession
                // Bắt ipAddress và userAgent từ req (NextAuth req handler)
                // Lưu ý: req.headers có thể truy xuất qua req.headers.get (tuỳ thuộc vào context)
                // Request object trong trường hợp credentials:
                const ipAddress =
                    (req.headers && req.headers["x-forwarded-for"]) ||
                    "unknown";
                const userAgent =
                    (req.headers && req.headers["user-agent"]) || "unknown";

                // Sinh 1 giá trị session token device giả lập (trên thực tế có thể gen id ngẫu nhiên băm)
                // const rawDeviceToken = `${user.id}-${Date.now()}-${Math.random()}`;
                // const deviceTokenHash = await bcrypt.hash(rawDeviceToken, 10);

                // Lưu thông tin device tracking ngay khi người dùng đăng nhập
                // await prisma.userDeviceSession.create({
                //     data: {
                //         userId: user.id,
                //         refreshTokenHash: deviceTokenHash,
                //         deviceName: "Web Login",
                //         ipAddress,
                //         userAgent,
                //         expiresAt: new Date(
                //             Date.now() + 30 * 24 * 60 * 60 * 1000,
                //         ), // 30 days
                //     },
                // });

                // Trả về user thoả mãn model schema
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                    status: user.status,
                    loginMeta: {
                        ipAddress,
                        userAgent,
                    },
                };
            },
        }),
    ],
    callbacks: {
        // 2. Authorization (Kiểm soát Business logic)
        async signIn({ user, account }) {
            // Vì đang pass đối tượng user từ adapter hoặc từ authorize ra
            const customUser = user as {
                id: string;
                status: string;
                loginMeta?: {
                    ipAddress?: string;
                    userAgent?: string;
                };
            };

            if (customUser.status === "PENDING") {
                throw new Error(AuthError.ACCOUNT_PENDING);
            }

            if (customUser.status === "BLOCKED") {
                throw new Error(AuthError.ACCOUNT_BLOCKED);
            }
            const rawDeviceToken = `${user.id}-${Date.now()}-${Math.random()}`;
            const refreshTokenHash = await bcrypt.hash(rawDeviceToken, 10);

            await prisma.userDeviceSession.create({
                data: {
                    userId: customUser.id,
                    refreshTokenHash,
                    deviceName: "Web Login",
                    ipAddress: customUser.loginMeta?.ipAddress,
                    userAgent: customUser.loginMeta?.userAgent,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                },
            });

            return true;
        },
        async jwt({ token, user }) {
            // Khi user vừa đăng nhập thành công, ta có đối tượng user từ authorize callback
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.status = user.status;
            }
            return token;
        },
        // Callback session trả về field extended
        async session({ session, user, token }) {
            if (session.user) {
                // Dùng Database strategy -> đối tượng user ở đây được lấy thẳng từ cơ sở dữ liệu (từ adapter)
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.status = token.status as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
};
