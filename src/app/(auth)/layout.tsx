export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-start pt-[12vh] sm:justify-center sm:pt-0 overflow-y-auto bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
