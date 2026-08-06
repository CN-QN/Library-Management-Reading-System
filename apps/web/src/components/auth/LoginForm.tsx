'use client';

import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, KeyRound, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api/auth';

declare global {
  interface Window { google?: { accounts: { id: { initialize(options: { client_id: string; callback(response: { credential: string }): void }): void; renderButton(element: HTMLElement, options: Record<string, unknown>): void } } } }
}

export function LoginForm() {
  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetEmailParam = searchParams.get('resetEmail') || '';
  const resetTokenParam = searchParams.get('resetToken') || '';
  const rawReturnUrl = searchParams.get('returnUrl') || '/';
  const returnUrl = rawReturnUrl.startsWith('/') ? rawReturnUrl : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleConfigError, setGoogleConfigError] = useState('');
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Forgot password modal states
  const [isForgotOpen, setIsForgotOpen] = useState(Boolean(resetEmailParam && resetTokenParam));
  const [forgotEmail, setForgotEmail] = useState(resetEmailParam);
  const [resetToken, setResetToken] = useState(resetTokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [tokenStep, setTokenStep] = useState(Boolean(resetEmailParam && resetTokenParam));
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push(returnUrl);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setError(message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGoogleButton = useCallback(() => {
    if (!googleClientId || !googleScriptReady || !window.google || !googleButtonRef.current) return;
    window.google.accounts.id.initialize({ client_id: googleClientId, callback: async ({ credential }) => { try { await authApi.google(credential); window.location.assign(returnUrl); } catch { setError('Đăng nhập bằng Google không thành công.'); } } });
    googleButtonRef.current.replaceChildren();
    const width = Math.min(400, Math.max(240, googleButtonRef.current.clientWidth));
    window.google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', shape: 'pill', size: 'large', width, text: 'continue_with' });
  }, [googleClientId, googleScriptReady, returnUrl]);

  useEffect(() => {
    let active = true;
    authApi.googleConfig()
      .then((response) => {
        const payload = response.data?.data ?? response.data;
        if (active && payload?.clientId) setGoogleClientId(payload.clientId);
      })
      .catch(() => {
        if (active) setGoogleConfigError('Đăng nhập Google hiện chưa sẵn sàng.');
      });
    return () => { active = false; };
  }, []);
  useEffect(() => { renderGoogleButton(); }, [renderGoogleButton]);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setIsForgotSubmitting(true);

    try {
      const res = await authApi.forgotPassword(forgotEmail);
      const devToken = (res.data?.data as { token?: string } | undefined)?.token;
      if (devToken) {
        setResetToken(devToken);
      }
      setForgotMessage(res.data?.message || 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.');
      setTokenStep(true);
    } catch (err: unknown) {
      setForgotError(axios.isAxiosError(err) ? err.response?.data?.message : 'Không thể gửi yêu cầu khôi phục.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setIsForgotSubmitting(true);

    try {
      const res = await authApi.resetPassword(forgotEmail, resetToken, newPassword);
      setForgotMessage(res.data?.message || 'Đặt lại mật khẩu mới thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => {
        setIsForgotOpen(false);
        setTokenStep(false);
      }, 2000);
    } catch (err: unknown) {
      setForgotError(axios.isAxiosError(err) ? err.response?.data?.message : 'Liên kết hoặc token không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Badge & Title */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-1">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Hệ Thống Đọc Sách Số Độc Quyền</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          Đăng nhập LibraryHub
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground max-w-sm">
          Truy cập ngay kho sách bản quyền phong phú và trải nghiệm đọc mượt mà
        </p>
      </div>

      {/* Glassmorphism Login Card */}
      <div className="bg-card/90 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-primary/15 relative overflow-hidden transition-all">
        <div className="space-y-5">
          {/* Google Login Button */}
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onLoad={() => setGoogleScriptReady(true)}
            onError={() => setGoogleConfigError('Không thể tải dịch vụ đăng nhập Google.')}
          />
          <div ref={googleButtonRef} className="flex min-h-11 w-full justify-center" />
          {googleConfigError && (
            <p className="text-center text-xs font-medium text-destructive">{googleConfigError}</p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">Hoặc Email Độc Giả</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <form className="space-y-4.5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                Email / Tài khoản *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl py-2.5 px-3.5 text-sm"
                placeholder="vividu@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Mật khẩu *
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl py-2.5 px-3.5 text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full font-bold rounded-2xl gap-2 shadow-lg shadow-primary/20 cursor-pointer" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  Đăng nhập tài khoản
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              Chưa có tài khoản độc giả?{' '}
              <Link href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline font-bold">
                Đăng ký ngay
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Quên Mật Khẩu với Token Check 6 Chữ Số */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                  Khôi phục mật khẩu
              </h3>
              <button type="button" onClick={() => setIsForgotOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {forgotError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl font-medium">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-medium rounded-xl flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{forgotMessage}</span>
              </div>
            )}

            {!tokenStep ? (
              <form onSubmit={handleRequestToken} className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Nhập email đã đăng ký. Nếu tài khoản tồn tại, hệ thống sẽ gửi liên kết đặt lại mật khẩu có hiệu lực trong 15 phút.
                </p>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Email đăng ký *</label>
                  <Input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="VD: reader@gmail.com"
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsForgotOpen(false)} className="rounded-xl">Hủy</Button>
                  <Button type="submit" disabled={isForgotSubmitting} className="rounded-xl font-bold">
                    {isForgotSubmitting ? 'Đang gửi...' : 'Gửi hướng dẫn khôi phục'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Token từ email *</label>
                  <Input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Dán token trong email"
                    className="font-mono tracking-widest font-extrabold text-center text-lg rounded-xl text-primary border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Mật khẩu mới *</label>
                  <Input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsForgotOpen(false)} className="rounded-xl">Hủy</Button>
                  <Button type="submit" disabled={isForgotSubmitting} className="rounded-xl font-bold">
                    {isForgotSubmitting ? 'Đang xác thực...' : 'Đổi mật khẩu mới'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
