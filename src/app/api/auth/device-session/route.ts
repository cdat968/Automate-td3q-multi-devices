import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    console.log("session post user::: ", session);
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const rawDeviceToken = `${session.user.id}-${Date.now()}-${Math.random()}`;
    const refreshTokenHash = await bcrypt.hash(rawDeviceToken, 10);

    await prisma.userDeviceSession.create({
        data: {
            userId: session.user.id,
            refreshTokenHash,
            deviceName: "Web Login",
            ipAddress,
            userAgent,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
    });

    return Response.json({ success: true });
}