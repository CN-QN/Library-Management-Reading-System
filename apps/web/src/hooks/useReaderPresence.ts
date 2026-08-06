'use client';

import { useEffect } from 'react';
import apiClient from '@/lib/api-client';

export function useReaderPresence(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const sendHeartbeat = async () => {
      try {
        await apiClient.post('/presence/heartbeat');
      } catch {
        // Silently ignore presence heartbeat errors
      }
    };

    // Gửi heartbeat lần đầu tiên ngay khi mount
    sendHeartbeat();

    // Gửi heartbeat định kỳ mỗi 2 phút (120,000ms)
    const interval = setInterval(sendHeartbeat, 120000);

    return () => clearInterval(interval);
  }, [enabled]);
}
