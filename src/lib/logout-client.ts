export async function logoutAndRedirect() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
  window.location.replace("/");
}
