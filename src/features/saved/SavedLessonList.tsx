import type { ReactNode } from 'react';
import { EmptyState } from '../../components/ui/Feedback.tsx';
import { useVocabulary } from '../../hooks/vocabulary-context.ts';
import { LessonCard } from '../lessons/LessonCard.tsx';
import { useLessonProgress } from '../lessons/useLessonProgress.ts';
import type { SavedLesson } from '../../types/study.ts';
import type { Lesson } from '../../types/vocabulary.ts';

export interface SavedLessonListProps {
  rows: readonly SavedLesson[];
  savedIds: ReadonlySet<string>;
  onToggleSave: (lesson: Lesson) => void;
  empty?: ReactNode;
}

/**
 * Các buổi học đã lưu.
 *
 * Dùng lại đúng thẻ buổi học của danh sách chính, kể cả tiến độ, để một buổi
 * trông giống nhau ở mọi nơi nó xuất hiện. Buổi nào không còn trong bộ dữ liệu
 * thì bỏ qua chứ không hiện dòng trống.
 */
export function SavedLessonList({ rows, savedIds, onToggleSave, empty }: SavedLessonListProps) {
  const { index } = useVocabulary();
  const lessons = rows.flatMap((row) => {
    const lesson = index.byLesson.get(row.lessonId);
    return lesson === undefined ? [] : [lesson];
  });
  const { progress } = useLessonProgress(lessons);

  if (lessons.length === 0) {
    return (
      empty ?? (
        <EmptyState
          icon="book"
          title="Chưa lưu buổi học nào"
          description="Bấm ngôi sao trên một buổi để để dành buổi đó cho lần sau."
        />
      )
    );
  }

  return (
    <ul
      aria-label="Các buổi học đã lưu"
      className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-2.5 xsm:grid-cols-1"
    >
      {lessons.map((lesson) => (
        <li
          key={lesson.id}
          className="min-w-0"
        >
          <LessonCard
            lesson={lesson}
            progress={progress.get(lesson.id)}
            showLevel
            saved={savedIds.has(lesson.id)}
            onToggleSave={onToggleSave}
          />
        </li>
      ))}
    </ul>
  );
}
