export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-1 items-center justify-center bg-[var(--color-background)] px-4 py-12">
      {children}
    </div>
  );
}

