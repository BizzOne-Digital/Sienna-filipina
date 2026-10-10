import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { handleError, isSameOrigin, jsonError } from "@/lib/http";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { ContactMessage } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(200),
  phone: z.string().trim().max(40).optional().default(""),
  subject: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(10, "Please write a little more (10+ characters)").max(5000),
  website: z.string().optional(), // honeypot: real visitors never fill this
  startedAt: z.number().int(), // set when the form rendered
});

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return jsonError(403, "Cross-origin request rejected");
    const body = ContactSchema.parse(await req.json());

    // Spam signals get a generic success so bots learn nothing.
    const tooFast = Date.now() - body.startedAt < 3000;
    if (body.website || tooFast) return NextResponse.json({ success: true });

    const ipHash = hashIp(await clientIp());
    if (!(await rateLimit(`contact:${ipHash}`, 5, 3600))) {
      return jsonError(429, "You have sent several messages recently. Please try again later.");
    }
    const linkCount = (body.message.match(/https?:\/\//g) ?? []).length;
    if (linkCount > 3) return jsonError(400, "Please remove some links from your message.");

    await connectDB();
    await ContactMessage.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      message: body.message,
      ipHash,
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
