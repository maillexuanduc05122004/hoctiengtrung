import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { AppShell } from './components/AppShell.tsx';
import { Spinner } from './components/ui/Feedback.tsx';
import { SettingsProvider } from './components/providers/SettingsProvider.tsx';
import { VocabularyProvider } from './components/providers/VocabularyProvider.tsx';

// Mỗi chế độ luyện tập là một gói riêng để lần mở đầu tiên không phải tải hết.
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage.tsx'));
const TypingPage = lazy(() => import('./pages/TypingPage.tsx'));
const ListeningPage = lazy(() => import('./pages/ListeningPage.tsx'));
const SpeakingPage = lazy(() => import('./pages/SpeakingPage.tsx'));
const LessonsPage = lazy(() => import('./pages/LessonsPage.tsx'));
const LessonDetailPage = lazy(() => import('./pages/LessonDetailPage.tsx'));
const DictionaryPage = lazy(() => import('./pages/DictionaryPage.tsx'));
const ProgressPage = lazy(() => import('./pages/ProgressPage.tsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx'));
const DataSourcePage = lazy(() => import('./pages/DataSourcePage.tsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'));

export function App() {
  return (
    <SettingsProvider>
      <VocabularyProvider>
        <Suspense fallback={<Spinner label="Đang mở" />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="the" element={<FlashcardsPage />} />
              <Route path="go" element={<TypingPage />} />
              <Route path="nghe" element={<ListeningPage />} />
              <Route path="noi" element={<SpeakingPage />} />
              <Route path="buoi-hoc" element={<LessonsPage />} />
              <Route path="buoi-hoc/:lessonId" element={<LessonDetailPage />} />
              <Route path="tra-tu" element={<DictionaryPage />} />
              <Route path="tien-do" element={<ProgressPage />} />
              <Route path="cai-dat" element={<SettingsPage />} />
              <Route path="nguon-du-lieu" element={<DataSourcePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </VocabularyProvider>
    </SettingsProvider>
  );
}
