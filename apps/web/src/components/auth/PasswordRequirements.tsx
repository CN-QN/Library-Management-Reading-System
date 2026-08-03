import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordRequirementsProps {
  /** Giá trị mật khẩu hiện tại để kiểm tra tiêu chí */
  password?: string;
}

/**
 * PasswordRequirements
 * 
 * Hiển thị checklist 5 tiêu chí của mật khẩu theo thời gian thực.
 * Sử dụng icon xanh lá khi đạt, xám/đỏ khi chưa đạt.
 * 
 * Dùng ở: AuthRegisterForm component để người dùng theo dõi độ mạnh mật khẩu.
 * 
 * @param password - Giá trị mật khẩu hiện tại nhập vào từ input
 */
export function PasswordRequirements({ password = '' }: PasswordRequirementsProps) {
  const criteria = [
    { label: 'Tối thiểu 6 ký tự', met: password.length >= 6 },
    { label: 'Có chữ hoa (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Có chữ thường (a-z)', met: /[a-z]/.test(password) },
    { label: 'Có chữ số (0-9)', met: /[0-9]/.test(password) },
    { label: 'Có ký tự đặc biệt', met: /[\W_]/.test(password) },
  ];

  return (
    <div className="mt-2 text-sm space-y-1">
      {criteria.map((c, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {c.met ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <X className="w-4 h-4 text-muted-foreground/50" />
          )}
          <span className={c.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
