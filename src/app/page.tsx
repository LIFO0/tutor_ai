import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName } from "@/lib/auth";

export default async function Home() {
  const c = await cookies();
  const token = c.get(authCookieName)?.value;
  if (token) redirect("/dashboard");
  redirect("/login");
}
