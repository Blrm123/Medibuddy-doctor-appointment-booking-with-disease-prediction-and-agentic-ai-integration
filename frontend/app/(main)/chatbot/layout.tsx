export default function ChatroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 top-16 bottom-0 flex flex-col bg-background overflow-hidden z-0">
      {children}
    </div>
  );
}
