import ReaderLayout from "@/components/layout/ReaderLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AppReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ReaderLayout>{children}</ReaderLayout>
    </ProtectedRoute>
  );
}
