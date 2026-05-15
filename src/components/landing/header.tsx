import { isUserAuthenticated } from "@/lib/current-user";
import { LandingHeaderClient } from "@/components/landing/landing-header-client";

export default async function Header() {
  const isAuthenticated = await isUserAuthenticated();
  return <LandingHeaderClient isAuthenticated={isAuthenticated} />;
}
