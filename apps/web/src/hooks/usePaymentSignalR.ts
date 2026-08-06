'use client';

import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_URL } from '@/lib/api-client';

export interface UsePaymentSignalROptions {
  orderCode: string | null;
  onSuccess: (data: { orderCode: string; bookId: string; status: string }) => void;
  enabled?: boolean;
}

export function usePaymentSignalR({
  orderCode,
  onSuccess,
  enabled = true,
}: UsePaymentSignalROptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!enabled || !orderCode) return;

    // Chuyển URL API dạng http://localhost:5000/api sang websocket hub http://localhost:5000/hubs/payment
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    const hubUrl = `${baseUrl}/hubs/payment`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection
      .start()
      .then(() => {
        // Gia nhập room theo mã đơn hàng orderCode
        return connection.invoke('JoinOrderGroup', orderCode);
      })
      .catch((err) => {
        console.warn('SignalR payment hub connection warning:', err);
      });

    // Lắng nghe thông điệp PaymentSuccess được đẩy từ Redis Pub/Sub qua SignalR
    connection.on('PaymentSuccess', (payload: { orderCode: string; bookId: string; status: string }) => {
      onSuccessRef.current(payload);
    });

    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke('LeaveOrderGroup', orderCode).catch(() => {});
      }
      connection.stop().catch(() => {});
    };
  }, [orderCode, enabled]);
}
