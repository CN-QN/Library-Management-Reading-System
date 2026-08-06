import { redirect } from 'next/navigation';

export default function LegacyBorrowingsPage() {
  redirect('/admin/borrowings');
}
