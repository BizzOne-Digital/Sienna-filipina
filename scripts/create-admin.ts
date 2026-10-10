/**
 * Creates (or resets the password of) an admin user from environment variables.
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npm run create-admin
 * Run it from your own machine; there is deliberately no public endpoint for this.
 */
import "./env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../lib/db/connect";
import { AdminSession, AdminUser } from "../models";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "Site Admin";
  const reset = process.argv.includes("--reset-password");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Set ADMIN_EMAIL to a valid email address.");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");

  await connectDB();
  const existing = await AdminUser.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing && !reset) {
    console.log(`Admin ${email} already exists. Re-run with --reset-password to change its password.`);
  } else if (existing) {
    existing.passwordHash = passwordHash;
    existing.active = true;
    await existing.save();
    await AdminSession.deleteMany({ admin: existing._id });
    console.log(`Password reset for ${email}. Existing sessions were signed out.`);
  } else {
    await AdminUser.create({ email, name, passwordHash });
    console.log(`Admin ${email} created. Sign in at /admin/login.`);
  }
  console.log("Remove ADMIN_PASSWORD from your environment now that it has been used.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
