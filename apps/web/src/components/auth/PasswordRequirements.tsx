import React from 'react';
import { X } from 'lucide-react';

interface PasswordRequirementsProps {
  /** Giá trị mật khẩu hiện tại để kiểm tra tiêu chí */
  password?: string;
}

/**
 * PasswordRequirements
 * 
 * Hiển thị danh sách các tiêu chí mật khẩu CHƯA ĐẠT.
 * Khi bắt đầu nhập, tiêu chí nào chưa đạt sẽ hiển thị.
 * Tiêu chí nào đạt rồi sẽ tự động ẩn đi.
 * Khi đạt 100% tiêu chí hoặc khi chưa nhập gì, component không hiển thị gì cả.
 * 
 * @param password - Giá trị mật khẩu hiện tại nhập vào từ input
 */
export function PasswordRequirements({ password = '' }: PasswordRequirementsProps) {
  if (!password || password.length === 0) {
    return null;
  }

  const criteria = [
    { label: 'Tối thiểu 6 ký tự', met: password.length >= 6 },
    { label: 'Có chữ hoa (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Có chữ thường (a-z)', met: /[a-z]/.test(password) },
    { label: 'Có chữ số (0-9)', met: /[0-9]/.test(password) },
    { label: 'Có ký tự đặc biệt', met: /[\W_]/.test(password) },
  ];

  const unMetCriteria = criteria.filter((c) => !c.met);

  if (unMetCriteria.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 text-xs space-y-1.5 transition-all duration-200">
      {unMetCriteria.map((c, idx) => (
        <div key={idx} className="flex items-center gap-2 text-muted-foreground">
          <X className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span>{c.label}</span>
        </div>
      ))}
    </div>
  );
}
