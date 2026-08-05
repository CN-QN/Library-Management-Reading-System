import ReaderLayout from "@/components/layout/ReaderLayout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ReaderLayout>{children}</ReaderLayout>;
}
