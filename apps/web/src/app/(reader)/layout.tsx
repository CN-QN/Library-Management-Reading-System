import ReaderLayout from "@/components/layout/ReaderLayout";

export default function AppReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ReaderLayout>{children}</ReaderLayout>;
}
