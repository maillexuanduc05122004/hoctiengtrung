import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { AppShell } from './components/AppShell.tsx';
import { Spinner } from './components/ui/Feedback.tsx';
import { AuthProvider } from './components/providers/AuthProvider.tsx';
import { SettingsProvider } from './components/providers/SettingsProvider.tsx';
import { VocabularyProvider } from './components/providers/VocabularyProvider.tsx';

// Mỗi chế độ luyện tập là một gói riêng để lần mở đầu tiên không phải tải hết.
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const TypingPage = lazy(() => import('./pages/TypingPage.tsx'));
const ListeningPage = lazy(() => import('./pages/ListeningPage.tsx'));
const SpeakingPage = lazy(() => import('./pages/SpeakingPage.tsx'));
const LessonsPage = lazy(() => import('./pages/LessonsPage.tsx'));
const LessonDetailPage = lazy(() => import('./pages/LessonDetailPage.tsx'));
const SentencesPage = lazy(() => import('./pages/SentencesPage.tsx'));
const FixedListeningPage = lazy(() => import('./pages/FixedListeningPage.tsx'));
const FixedListeningLessonPage = lazy(() => import('./pages/FixedListeningLessonPage.tsx'));
const PassageListeningPage = lazy(() => import('./pages/PassageListeningPage.tsx'));
const TranslationPage = lazy(() => import('./pages/TranslationPage.tsx'));
const PronunciationPage = lazy(() => import('./pages/PronunciationPage.tsx'));
const ProgressPage = lazy(() => import('./pages/ProgressPage.tsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx'));
const DataSourcePage = lazy(() => import('./pages/DataSourcePage.tsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'));

/**
 * Đường dẫn cũ của chế độ lật thẻ, nay đã bỏ.
 *
 * Dấu trang và ứng dụng đã cài vẫn có thể mở `/the?lesson=L1-B03`, nên chuyển
 * sang Gõ đáp án và giữ nguyên chuỗi truy vấn: vẫn đúng buổi học, đúng cấp và
 * đúng nguồn từ. `replace` để nút quay lại không đưa người học về địa chỉ cũ
 * rồi lại bị đẩy đi lần nữa.
 */
function FlashcardsRedirect() {
  const { search } = useLocation();
  return (
    <Navigate
      to={`/go${search}`}
      replace
    />
  );
}

export function App() {
  return (
    <SettingsProvider>
      {/* Phiên đăng nhập chỉ phục vụ phần "Câu của tôi"; đọc đồng bộ từ kho nên không chặn gì. */}
      <AuthProvider>
        <VocabularyProvider>
          <Suspense fallback={<Spinner label="Đang mở" />}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<HomePage />} />
                <Route path="go" element={<TypingPage />} />
                <Route path="nghe" element={<ListeningPage />} />
                <Route path="noi" element={<SpeakingPage />} />
                <Route path="buoi-hoc" element={<LessonsPage />} />
                <Route path="buoi-hoc/:lessonId" element={<LessonDetailPage />} />
                <Route path="cau-cua-toi" element={<SentencesPage />} />
                <Route path="nghe-co-dinh" element={<FixedListeningPage />} />
                <Route path="nghe-co-dinh/:lessonId" element={<FixedListeningLessonPage />} />
                <Route path="dich-cau" element={<TranslationPage />} />
                <Route path="phat-am" element={<PronunciationPage />} />
                <Route path="nghe-doan-van" element={<PassageListeningPage />} />
                <Route path="nghe-doan-van/:passageId" element={<PassageListeningPage />} />
                <Route path="tien-do" element={<ProgressPage />} />
                <Route path="cai-dat" element={<SettingsPage />} />
                <Route path="nguon-du-lieu" element={<DataSourcePage />} />
                {/* Lật thẻ, Sổ tay và Tra từ đã bỏ; giữ đường dẫn cũ để không rơi vào trang 404. */}
                <Route path="the" element={<FlashcardsRedirect />} />
                <Route path="da-luu" element={<Navigate to="/" replace />} />
                <Route path="tra-tu" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </VocabularyProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
