import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connect";
import { handleError, isSameOrigin, jsonError } from "@/lib/http";
import { clientIp, hashIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { AdminUser } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

// Compared against when the email is unknown, so response time does not reveal valid accounts.
const DUMMY_HASH = "$2b$12$6m.pdJO5QIFz5IT51qvmV.NrunEUmUsnlfXDIdcbumvoVb5V8OdN.";

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return jsonError(403, "Cross-origin request rejected");
    const body = LoginSchema.parse(await req.json());
    const ipKey = `login:ip:${hashIp(await clientIp())}`;
    const emailKey = `login:email:${body.email}`;
    const [ipOk, emailOk] = await Promise.all([rateLimit(ipKey, 20, 900), rateLimit(emailKey, 8, 900)]);
    if (!ipOk || !emailOk) {
      return jsonError(429, "Too many sign-in attempts. Please wait 15 minutes and try again.");
    }

    await connectDB();
    const admin = await AdminUser.findOne({ email: body.email, active: true }).select("+passwordHash");
    const valid = await bcrypt.compare(body.password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !valid) return jsonError(401, "Incorrect email or password");

    await resetRateLimit(emailKey);
    admin.lastLoginAt = new Date();
    await admin.save();
    await createSession(String(admin._id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
