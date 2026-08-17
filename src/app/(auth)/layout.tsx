export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--page)] text-[var(--ink)]">{children}</div>;
}
