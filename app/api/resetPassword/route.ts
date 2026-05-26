import { prisma } from "@/prisma/prisma";
import { NextRequest } from "next/server";
import z from "zod";
import crypto from "crypto";
import dayjs from "dayjs";
import { sendMail } from "@/util/mailSender";
import { resetPasswordEmail } from "@/util/emailTemplates";

const BASE_URL = process.env.NEXT_PUBLIC_DOMAIN ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const parsedEmail = z.string().email().parse(email);

    const user = await prisma.user.findUnique({
      where: { email: parsedEmail },
    });

    if (!user) {
      return new Response(
        JSON.stringify({
          message:
            "If an account with that email exists, a reset link has been sent.",
        }),
        { status: 200 },
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: dayjs().add(1, "hour").toDate(),
      },
    });

    const resetUrl = `${BASE_URL}/auth/reset-password?token=${resetToken}`;

    await sendMail({
      to: user.email,
      user: user.name,
      subject: "Reset your Evolve password",
      htmlBody: resetPasswordEmail(user.name, resetUrl),
    });

    return new Response(
      JSON.stringify({
        message:
          "If an account with that email exists, a reset link has been sent.",
      }),
      { status: 200 },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
}
