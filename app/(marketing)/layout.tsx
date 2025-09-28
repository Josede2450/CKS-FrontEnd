export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main id="content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
