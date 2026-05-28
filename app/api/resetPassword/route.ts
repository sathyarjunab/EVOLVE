import { prisma } from "@/prisma/prisma";
import { NextRequest } from "next/server";
import z from "zod";
import crypto from "crypto";
import dayjs from "dayjs";
import bcrypt from "bcryptjs";
import { sendMail } from "@/util/mailSender";
import { resetPasswordEmail } from "@/util/emailTemplates";
import { passwordSchema } from "@/util/validator";

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

// ── PUT /api/resetPassword — verify token & set new password ─────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const token = z.string().min(1).parse(body.token);
    const newPassword = passwordSchema.parse(body.password);

    // The email link contains the raw token; the DB stores its SHA-256 hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const record = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });

    // Always delete an expired record so it can't be retried
    if (!record) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset link." }),
        { status: 400 },
      );
    }

    if (dayjs().isAfter(dayjs(record.expiresAt))) {
      await prisma.passwordResetToken.delete({ where: { token: hashedToken } });
      return new Response(
        JSON.stringify({ error: "This reset link has expired. Please request a new one." }),
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password and invalidate the token atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { token: hashedToken },
      }),
    ]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
}
