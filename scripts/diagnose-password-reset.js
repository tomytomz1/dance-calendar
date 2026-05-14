const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    });
}

async function main() {
  console.log("=== Password reset diagnostics ===\n");

  console.log("RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);
  console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "(not set)");
  console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "(not set)");
  console.log();

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const users = await prisma.user.findMany({
    select: { email: true, password: true, name: true, role: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log(`Users in DB: ${users.length}`);
  for (const user of users) {
    console.log(
      `  - ${user.email} | password: ${user.password ? "yes" : "NO (Google-only or no password)"} | role: ${user.role}`
    );
  }
  console.log();

  const emailArg = process.argv[2];
  if (!emailArg) {
    console.log("Tip: rerun with an email to test Resend:");
    console.log("  node scripts/diagnose-password-reset.js you@example.com");
    await prisma.$disconnect();
    return;
  }

  const normalized = emailArg.toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { email: true, password: true, name: true },
  });

  if (!user) {
    console.log(`No user found for: ${normalized}`);
    console.log("(Forgot-password still shows success — no email is sent.)");
    await prisma.$disconnect();
    return;
  }

  if (!user.password) {
    console.log(`User ${normalized} exists but has NO password.`);
    console.log("Reset email is skipped for Google-only accounts.");
    await prisma.$disconnect();
    return;
  }

  const { Resend } = require("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Dance Calendar password reset test",
    html: "<p>If you received this, Resend is working for password reset.</p>",
  });

  console.log("Resend test send:");
  console.log("  success:", !error);
  console.log("  messageId:", data?.id || null);
  console.log("  error:", error || null);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
