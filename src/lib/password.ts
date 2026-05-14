import { compare, hash } from "bcryptjs";

export async function hashPassword(password: string) {
  return await hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return await compare(password, passwordHash);
}
