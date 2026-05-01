export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full w-full bg-zinc-200 dark:bg-black">{children}</div>
  );
}

