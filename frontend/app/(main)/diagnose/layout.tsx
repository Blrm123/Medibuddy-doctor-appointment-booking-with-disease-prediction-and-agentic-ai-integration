export default function DiagnoseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen w-full bg-background no-scrollbar">{children}</div>;
}
