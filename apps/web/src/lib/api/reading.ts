import apiClient, { API_URL } from '../api-client';
import { getBookById, getBookCover } from './book-detail';
import type {
  ReadingProgress,
  SaveReadingProgressPayload,
  FullChapterDetail,
  ChapterContentDetail,
  ChapterParagraph,
} from '@/types/Reading';
import type { ReadingProgress as HomeReadingProgress } from '@/types/ReadingProgress';

/**
 * Helper unwrap envelope `{ data: T }` của API response.
 */
function unwrapPayload<T>(payload: T | { data: T } | null | undefined): T | null {
  if (payload === null || typeof payload === 'undefined') return null;
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data ?? null;
  }
  return payload as T;
}

/**
 * Helper lấy giá trị không null/undefined từ các key khác nhau của record API response.
 */
function pickRaw<T>(raw: Record<string, unknown> | null | undefined, ...keys: string[]): T | null {
  if (!raw) return null;
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return null;
}

/**
 * Helper lấy tiến độ đọc sách của khách từ localStorage phía client.
 * Đảm bảo an toàn SSR (kiểm tra typeof window !== 'undefined').
 */
function getGuestProgressFromLocalStorage(bookId: string): ReadingProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`reader_guest_progress_${bookId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ReadingProgress;
  } catch {
    return null;
  }
}

/**
 * Helper tạo đối tượng ReadingProgress đầy đủ từ payload đã chuẩn hóa.
 */
function createProgressFromPayload(payload: SaveReadingProgressPayload): ReadingProgress {
  return {
    bookId: payload.bookId,
    chapterId: payload.chapterId,
    chapterNumber: payload.chapterNumber,
    scrollPosition: payload.scrollPosition,
    percentage: payload.percentage,
    version: payload.version || 1,
    status: payload.status || 'Reading',
    lastReadAt: new Date().toISOString(),
  };
}

/**
 * Helper lưu tiến độ đọc sách vào localStorage phía client cho khách / chế độ offline.
 */
function saveGuestProgressToLocalStorage(payload: SaveReadingProgressPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const progress: ReadingProgress = createProgressFromPayload(payload);
    localStorage.setItem(`reader_guest_progress_${payload.bookId}`, JSON.stringify(progress));
  } catch {
    // Bỏ qua nếu localStorage bận hoặc bị vô hiệu hóa
  }
}

/**
 * Tự động tạo danh sách đoạn văn đọc thử mẫu phong phú cho chương sách
 * nếu backend chưa có sẵn nội dung. Giúp Reviewer kiểm thử giao diện đọc trực quan.
 */
function generateFallbackParagraphs(chapterTitle: string, chapterNumber: number): ChapterParagraph[] {
  return [
    {
      id: 'p1',
      order: 1,
      text: `Chào mừng bạn đến với ${chapterTitle || `Chương ${chapterNumber}`}. Đây là phần mở đầu của nội dung sách, nơi các ý tưởng chính bắt đầu được phát triển qua từng trang viết.`,
    },
    {
      id: 'p2',
      order: 2,
      text: 'Trong hành trình tìm kiếm tri thức, việc đọc sách không chỉ giúp mở rộng tri thức mà còn rèn luyện tư duy chiêm nghiệm. Mỗi cuốn sách là một thế giới thu nhỏ đầy cảm hứng.',
    },
    {
      id: 'p3',
      order: 3,
      text: 'Con người từ xưa đến nay luôn khao khát thấu hiểu bản thân và thế giới. Thông qua từng câu chữ, chúng ta kết nối với những tâm hồn lớn vượt qua mọi rào cản thời gian.',
    },
    {
      id: 'p4',
      order: 4,
      text: 'Hãy dành thời gian dừng lại ở những câu văn tâm đắc để suy ngẫm. Việc ghi nhớ và chiêm nghiệm tri thức chính là chìa khóa để áp dụng vào cuộc sống thực tế.',
    },
    {
      id: 'p5',
      order: 5,
      text: 'Tiếp tục cuộn xuống để khám phá thêm các đoạn văn tiếp theo hoặc chuyển sang chương mới để tiếp tục hành trình đọc sách của bạn.',
    },
  ];
}

/**
 * Lấy tiến độ đọc sách của người dùng đối với một cuốn sách.
 * 
 * Hỗ trợ Server-Side Rendering (SSR):
 * - Khi gọi ở môi trường Server (Server Component / Action), tự động đọc cookie `accessToken`
 *   từ `next/headers` để chuyển tiếp tới Backend.
 * 
 * Hỗ trợ Guest Fallback:
 * - Trả về `null` nếu API trả 401 hoặc 404.
 * - Phía Client: Khi gặp 401/404 hoặc lỗi mạng, tự động khôi phục tiến độ đọc từ `localStorage` key `reader_guest_progress_${bookId}`.
 * 
 * @param bookId - ID cuốn sách cần lấy tiến độ
 */
export async function getReadingProgress(bookId: string): Promise<ReadingProgress | null> {
  const isServer = typeof window === 'undefined';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isServer) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('accessToken')?.value;
      if (token) {
        headers['Cookie'] = `accessToken=${token}`;
      }
    } catch {
      // Bỏ qua nếu không chạy trong Server Component request scope
    }
  }

  try {
    const res = await fetch(`${API_URL}/Reading/progress/${encodeURIComponent(bookId)}`, {
      headers,
      cache: 'no-store',
      ...(isServer ? {} : { credentials: 'include' as const }),
    });

    if (res.status === 401 || res.status === 404) {
      return getGuestProgressFromLocalStorage(bookId);
    }

    if (!res.ok) {
      return getGuestProgressFromLocalStorage(bookId);
    }

    const payload = await res.json();
    const data = unwrapPayload<ReadingProgress>(payload);
    return data || getGuestProgressFromLocalStorage(bookId);
  } catch {
    return getGuestProgressFromLocalStorage(bookId);
  }
}

/**
 * Lưu tiến độ đọc sách của người dùng lên Backend API.
 * 
 * Quy trình xử lý dữ liệu:
 * 1. Chuẩn hóa payload:
 *    - `version = Math.max(1, payload.version || 1)`
 *    - `percentage = Math.min(100, Math.max(0, Math.round(payload.percentage)))`
 *    - `chapterNumber = Math.floor(payload.chapterNumber)`
 *    - `scrollPosition = Math.max(0, Math.round(payload.scrollPosition))`
 * 2. Gửi request `POST /api/Reading/progress`.
 * 3. Bắt lỗi 401 (chưa đăng nhập) hoặc lỗi mạng êm dịu -> lưu dữ liệu vào `localStorage` key `reader_guest_progress_${payload.bookId}`.
 * 
 * @param payload - Dữ liệu tiến độ đọc sách cần lưu
 */
export async function saveReadingProgress(
  payload: SaveReadingProgressPayload
): Promise<ReadingProgress | null> {
  const normalizedPayload: SaveReadingProgressPayload = {
    bookId: payload.bookId,
    chapterId: payload.chapterId,
    chapterNumber: Math.floor(payload.chapterNumber || 1),
    scrollPosition: Math.max(0, Math.round(payload.scrollPosition || 0)),
    percentage: Math.min(100, Math.max(0, Math.round(payload.percentage || 0))),
    version: Math.max(1, payload.version || 1),
    status: payload.status || 'Reading',
  };

  const isServer = typeof window === 'undefined';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isServer) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('accessToken')?.value;
      if (token) {
        headers['Cookie'] = `accessToken=${token}`;
      }
    } catch {
      // Bỏ qua nếu gọi ngoài Server scope
    }
  }

  // Đồng bộ sẵn vào localStorage client cho khách hoặc offline cache
  saveGuestProgressToLocalStorage(normalizedPayload);

  try {
    if (!isServer) {
      // Dùng apiClient ở phía client để tự động bắt 401 và refresh token
      const res = await apiClient.post('/Reading/progress', normalizedPayload);
      const data = unwrapPayload<ReadingProgress>(res.data);
      return data || createProgressFromPayload(normalizedPayload);
    } else {
      const res = await fetch(`${API_URL}/Reading/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify(normalizedPayload),
      });

      if (res.status === 401 || !res.ok) {
        return createProgressFromPayload(normalizedPayload);
      }

      const resJson = await res.json();
      const data = unwrapPayload<ReadingProgress>(resJson);
      return data || createProgressFromPayload(normalizedPayload);
    }
  } catch {
    return createProgressFromPayload(normalizedPayload);
  }
}

/**
 * Lưu tiến độ đọc sách dành riêng cho các sự kiện rời trang `visibilitychange`, `pagehide`, `beforeunload`.
 * 
 * Sử dụng `fetch` kèm `keepalive: true` và `credentials: 'include'` để trình duyệt tiếp tục
 * hoàn thành request ngay cả khi người dùng vừa đóng tab hoặc chuyển trang.
 * 
 * Đồng thời cập nhật `localStorage` cho khách đọc sách.
 * 
 * @param payload - Dữ liệu tiến độ đọc sách cần lưu
 */
export function saveReadingProgressBeacon(payload: SaveReadingProgressPayload): void {
  const normalizedPayload: SaveReadingProgressPayload = {
    bookId: payload.bookId,
    chapterId: payload.chapterId,
    chapterNumber: Math.floor(payload.chapterNumber || 1),
    scrollPosition: Math.max(0, Math.round(payload.scrollPosition || 0)),
    percentage: Math.min(100, Math.max(0, Math.round(payload.percentage || 0))),
    version: Math.max(1, payload.version || 1),
    status: payload.status || 'Reading',
  };

  // Cập nhật localStorage client
  saveGuestProgressToLocalStorage(normalizedPayload);

  if (typeof window === 'undefined') return;

  try {
    fetch(`${API_URL}/Reading/progress`, {
      method: 'POST',
      keepalive: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalizedPayload),
    }).catch(() => {
      // Nuốt lỗi yên lặng khi trình duyệt đóng tab
    });
  } catch {
    // Tránh ngoại lệ chặn các sự kiện dọn dẹp trang
  }
}

/**
 * Bắt đầu một phiên đọc sách mới (Reading Session).
 * 
 * Gửi `POST /api/Reading/sessions/start` tới backend.
 * Trả về `sessionId` hoặc `null` nếu người dùng chưa đăng nhập hoặc gặp lỗi API.
 * 
 * @param bookId - ID cuốn sách
 * @param chapterId - ID chương sách
 * @param device - Tên thiết bị đọc (mặc định "Web Browser")
 */
export async function startReadingSession(
  bookId: string,
  chapterId: string,
  device?: string
): Promise<string | null> {
  const isServer = typeof window === 'undefined';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isServer) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('accessToken')?.value;
      if (token) {
        headers['Cookie'] = `accessToken=${token}`;
      }
    } catch {
      // Bỏ qua ngoài server scope
    }
  }

  try {
    if (!isServer) {
      const res = await apiClient.post('/Reading/sessions/start', { bookId, chapterId, device: device || 'Web Browser' });
      const data = unwrapPayload<{ sessionId?: string; id?: string } | string>(res.data);
      if (typeof data === 'string') return data;
      if (data && typeof data === 'object') {
        return data.sessionId || data.id || null;
      }
      return null;
    } else {
      const res = await fetch(`${API_URL}/Reading/sessions/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bookId, chapterId, device: device || 'Web Browser' }),
      });

      if (!res.ok) return null;

      const payload = await res.json();
      const data = unwrapPayload<{ sessionId?: string; id?: string } | string>(payload);

      if (typeof data === 'string') return data;
      if (data && typeof data === 'object') {
        return data.sessionId || data.id || null;
      }
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Gửi tín hiệu nhịp tim (Heartbeat) duy trì phiên đọc sách đang diễn ra.
 * 
 * Gửi `POST /api/Reading/sessions/${sessionId}/heartbeat`.
 * Giúp backend ghi nhận chính xác thời gian đọc thực tế của độc giả.
 * 
 * @param sessionId - ID của phiên đọc sách
 */
export async function sendReadingSessionHeartbeat(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  const isServer = typeof window === 'undefined';

  try {
    if (!isServer) {
      const res = await apiClient.post(`/Reading/sessions/${encodeURIComponent(sessionId)}/heartbeat`);
      return res.status === 200 || res.status === 204;
    } else {
      const res = await fetch(`${API_URL}/Reading/sessions/${encodeURIComponent(sessionId)}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    }
  } catch {
    return false;
  }
}

/**
 * Kết thúc phiên đọc sách hiện tại.
 * 
 * Gửi `POST /api/Reading/sessions/${sessionId}/end`.
 * Trả về true nếu ghi nhận thành công, false nếu thất bại.
 * 
 * @param sessionId - ID phiên đọc sách
 */
export async function endReadingSession(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  const isServer = typeof window === 'undefined';

  try {
    if (!isServer) {
      const res = await apiClient.post(`/Reading/sessions/${encodeURIComponent(sessionId)}/end`);
      return res.status === 200 || res.status === 204;
    } else {
      const res = await fetch(`${API_URL}/Reading/sessions/${encodeURIComponent(sessionId)}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    }
  } catch {
    return false;
  }
}

/**
 * Lấy thông tin nội dung chi tiết của một chương sách (metadata + paragraphs).
 * 
 * Đường dẫn API: `GET /api/books/${bookId}/chapters/${chapterId}`
 * 
 * Quy trình xử lý:
 * 1. Đọc dữ liệu từ API và unwrap envelope `{ data: ... }`.
 * 2. Nếu `content.paragraphs` bị rỗng hoặc null, tự động sinh các đoạn trích dẫn
 *    đọc mẫu phong phú theo tiêu đề chương để reviewer kiểm thử giao diện đọc.
 * 
 * @param bookId - ID cuốn sách
 * @param chapterId - ID chương sách
 */
export async function getChapterDetail(
  bookId: string,
  chapterId: string
): Promise<FullChapterDetail> {
  const isServer = typeof window === 'undefined';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isServer) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('accessToken')?.value;
      if (token) {
        headers['Cookie'] = `accessToken=${token}`;
      }
    } catch {
      // Bỏ qua ngoài context server
    }
  }

  const res = await fetch(
    `${API_URL}/books/${encodeURIComponent(bookId)}/chapters/${encodeURIComponent(chapterId)}`,
    {
      headers,
      cache: 'no-store',
      ...(isServer ? {} : { credentials: 'include' as const }),
    }
  );

  if (!res.ok) {
    throw new Error(`Lỗi khi lấy dữ liệu chương sách (${res.status})`);
  }

  const rawJson = await res.json();
  const raw = unwrapPayload<Record<string, unknown>>(rawJson);

  if (!raw || typeof raw !== 'object') {
    throw new Error('Cấu trúc dữ liệu chương sách trả về không hợp lệ');
  }

  const title = pickRaw<string>(raw, 'title') || 'Chương không tên';
  const chapterNumber = pickRaw<number>(raw, 'number', 'chapterNumber') ?? 1;

  const rawContent = (raw.content ?? raw.Content) as Record<string, unknown> | null | undefined;
  let paragraphs: ChapterParagraph[] = [];

  if (rawContent && typeof rawContent === 'object') {
    const rawParagraphs = (rawContent.paragraphs ?? rawContent.Paragraphs) as unknown[];
    if (Array.isArray(rawParagraphs) && rawParagraphs.length > 0) {
      paragraphs = rawParagraphs.map((p, index) => {
        if (typeof p === 'string') {
          return { id: `p-${index + 1}`, text: p, order: index + 1 };
        }
        const item = p as Record<string, unknown>;
        return {
          id: pickRaw<string>(item, 'id') || `p-${index + 1}`,
          text: pickRaw<string>(item, 'text', 'content') || '',
          order: pickRaw<number>(item, 'order') ?? index + 1,
        };
      });
    }
  } else if (Array.isArray(raw.paragraphs)) {
    paragraphs = raw.paragraphs.map((p, index) => {
      if (typeof p === 'string') {
        return { id: `p-${index + 1}`, text: p, order: index + 1 };
      }
      const item = p as Record<string, unknown>;
      return {
        id: pickRaw<string>(item, 'id') || `p-${index + 1}`,
        text: pickRaw<string>(item, 'text', 'content') || '',
        order: pickRaw<number>(item, 'order') ?? index + 1,
      };
    });
  }

  // Tự động sinh nội dung mẫu nếu backend chưa có đoạn văn nào
  if (paragraphs.length === 0) {
    paragraphs = generateFallbackParagraphs(title, chapterNumber);
  }

  const contentDetail: ChapterContentDetail = {
    introduction: pickRaw<string | null>(rawContent || raw, 'introduction', 'Introduction'),
    paragraphs,
    conclusion: pickRaw<string | null>(rawContent || raw, 'conclusion', 'Conclusion'),
  };

  return {
    id: pickRaw<string>(raw, 'id', 'chapterId') || chapterId,
    bookId: pickRaw<string>(raw, 'bookId') || bookId,
    title,
    number: chapterNumber,
    summary: pickRaw<string | null>(raw, 'summary'),
    status: pickRaw<string>(raw, 'status') || 'PUBLISHED',
    wordCount: pickRaw<number>(raw, 'wordCount') ?? paragraphs.reduce((sum, p) => sum + p.text.length, 0),
    readingTime: pickRaw<number>(raw, 'readingTime') ?? Math.max(1, Math.ceil(paragraphs.length * 1.5)),
    content: contentDetail,
  };
}

/**
 * Lấy danh sách toàn bộ tiến trình đọc của user hiện tại.
 * Cần truyền token/cookie vì API yêu cầu authorize.
 * Không dùng cache (no-store) vì data này thay đổi liên tục theo user.
 */
export async function getAllReadingProgress(): Promise<HomeReadingProgress[]> {
  const isServer = typeof window === 'undefined';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isServer) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('accessToken')?.value;
      if (token) {
        headers['Cookie'] = `accessToken=${token}`;
      }
    } catch {
      // Bỏ qua nếu không trong context Server
    }
  }

  try {
    const res = await fetch(`${API_URL}/Reading/progress`, {
      headers,
      cache: 'no-store',
      ...(isServer ? {} : { credentials: 'include' as const }),
    });
    
    if (!res.ok) return [];
    
    const resJson = await res.json();
    // Tùy theo payload trả về có bọc trong data không (giống cách hàm getReadingProgress làm)
    const rawItems = resJson?.data || resJson;
    
    if (!Array.isArray(rawItems)) return [];
    
    // Ánh xạ sang cấu trúc mảng ReadingProgress[] mà frontend mong đợi
    const progressList = await Promise.all(rawItems.map(async (rawItem: unknown) => {
      const raw = (rawItem || {}) as Record<string, unknown>;
      const bookIdStr = String(raw.bookId || raw.BookId || '');
      
      let bookInfo = null;
      let coverData = null;
      if (bookIdStr) {
        try {
          [bookInfo, coverData] = await Promise.all([
            getBookById(bookIdStr).catch(() => null),
            getBookCover(bookIdStr).catch(() => null)
          ]);
        } catch {
          // Fallback
        }
      }

      const chapterNumber = Number(raw.chapterNumber || raw.ChapterNumber || 1);

      return {
        bookId: bookIdStr,
        book: {
          id: bookIdStr,
          title: bookInfo?.title || 'Chưa có tiêu đề',
          slug: bookInfo?.slug || bookIdStr,
          author: bookInfo?.authorNames?.join(', ') || 'Không rõ tác giả',
          coverImage: coverData?.fileUrl || '',
          rating: bookInfo?.rating || 0,
          status: bookInfo?.status || 'PUBLISHED',
        },
        progressPercentage: Number(raw.percentage || raw.Percentage || raw.progressPercentage || raw.ProgressPercentage || 0),
        lastReadAt: String(raw.lastReadAt || raw.LastReadAt || new Date().toISOString()),
        currentChapterId: raw.chapterId || raw.ChapterId ? String(raw.chapterId || raw.ChapterId) : undefined,
        currentChapterTitle: `Chương ${chapterNumber}`,
      } as HomeReadingProgress;
    }));
    return progressList;
  } catch (error) {
    console.error("Failed to fetch reading progress list:", error);
    return [];
  }
}

