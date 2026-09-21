import { supabase } from './supabase';

export type Category = {
  id: number;
  name: string;
};

export type DailyQuestion = {
  id: string;
  category: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source: string;
  pointsValue: number;
};

export type UserStats = {
  streak: number;
  longestStreak: number;
  score: number;
};

export type HistoryEntry = {
  date: string;
  category: string;
  snippet: string;
  word: string;
  correct: boolean;
};

export type WeeklyRecapStats = {
  correctCount: number;
  totalAnswered: number;
  streak: number;
};

const CHOICE_LETTERS = ['a', 'b', 'c', 'd'];
// Fallback only — every question has its own `points_value` (10/20/30 by
// difficulty), this just covers a row where the column was never set.
const DEFAULT_POINTS_VALUE = 10;

function letterToIndex(letter: string): number {
  return CHOICE_LETTERS.indexOf((letter ?? '').toLowerCase());
}

function indexToLetter(index: number): string {
  return CHOICE_LETTERS[index];
}

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFrenchDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(
    new Date(year, month - 1, day)
  );
}

// Postgres `timestamp without time zone` comes back as "YYYY-MM-DD HH:mm:ss" with
// no offset. Supabase sessions default to UTC, so treat it as such explicitly —
// letting `new Date()` guess is inconsistent across JS engines.
function parseUtcTimestamp(raw: string): Date {
  return new Date(`${raw.replace(' ', 'T')}Z`);
}

// No `scheduled_for` column exists — everyone gets the same question on a given
// calendar day by rotating deterministically through the question bank.
function dayIndexForDate(date: Date, count: number): number {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor(utcMidnight / 86_400_000);
  return ((days % count) + count) % count;
}

const QUESTION_COLUMNS =
  'id, question_text, choice_a, choice_b, choice_c, choice_d, correct_choice, explanation, source, points_value, created_at, categories ( name )';

function mapQuestionRow(row: any): DailyQuestion {
  return {
    id: row.id,
    category: row.categories?.name ?? '',
    text: row.question_text,
    options: [row.choice_a, row.choice_b, row.choice_c, row.choice_d],
    correctIndex: letterToIndex(row.correct_choice),
    explanation: row.explanation,
    source: row.source ?? '',
    pointsValue: row.points_value ?? DEFAULT_POINTS_VALUE,
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('id, name').order('id', { ascending: true });

  if (error || !data) {
    if (error) console.error('Failed to fetch categories:', error.message);
    return [];
  }
  return data;
}

// `categoryIds` empty or omitted means "no preference" — pull from the full
// question bank rather than filtering to nothing.
export async function getTodayQuestion(categoryIds?: number[]): Promise<DailyQuestion | null> {
  let query = supabase
    .from('questions')
    .select(QUESTION_COLUMNS)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (categoryIds && categoryIds.length > 0) {
    query = query.in('category_id', categoryIds);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    if (error) console.error('Failed to fetch the daily question:', error.message);
    return null;
  }

  const dayIndex = dayIndexForDate(new Date(), data.length);
  return mapQuestionRow(data[dayIndex]);
}

export async function getQuestionById(questionId: string): Promise<DailyQuestion | null> {
  const { data, error } = await supabase
    .from('questions')
    .select(QUESTION_COLUMNS)
    .eq('id', questionId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Failed to fetch question:', error.message);
    return null;
  }
  return mapQuestionRow(data);
}

// Keyed on the calendar date the answer was submitted for, not on
// `questionId` — the daily rotation reuses question ids every `pool size`
// days, so "already answered this question" and "already answered today"
// are not the same check.
export async function getAnswerForToday(
  userId: string
): Promise<{ questionId: string; selectedIndex: number } | null> {
  const today = toLocalISODate(new Date());
  const { data, error } = await supabase
    .from('user_answers')
    .select('question_id, selected_choice')
    .eq('user_id', userId)
    .eq('answered_date', today)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch today's answer:", error.message);
    return null;
  }
  return data ? { questionId: data.question_id, selectedIndex: letterToIndex(data.selected_choice) } : null;
}

// Called once at app launch. A streak only survives if the user answered
// yesterday or today; otherwise it has lapsed since the last time stats were
// touched (e.g. they skipped 2+ days) and current_streak must drop to 0 even
// though no answer has come in yet to trigger that naturally. longest_streak
// is a record and is never touched here.
export async function resetExpiredStreak(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('current_streak, last_answered_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to check streak expiry:', error.message);
    return;
  }
  if (!data || data.current_streak === 0) return;

  const today = toLocalISODate(new Date());
  const yesterday = toLocalISODate(new Date(Date.now() - 86_400_000));
  const isStillAlive = data.last_answered_date === today || data.last_answered_date === yesterday;
  if (isStillAlive) return;

  const { error: updateError } = await supabase
    .from('user_stats')
    .update({ current_streak: 0 })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to reset expired streak:', updateError.message);
  }
}

// Bonus awarded the instant `current_streak` reaches (not passes) one of
// these values. Intentionally not persisted as "milestone already claimed"
// anywhere — the equality check below against the freshly computed streak is
// the only source of truth, so a milestone re-fires every time the streak
// climbs back up to it after a reset.
const STREAK_MILESTONE_BONUSES: Record<number, number> = {
  7: 20,
  30: 100,
  180: 300,
  365: 1000,
};

async function updateUserStatsAfterAnswer(userId: string, pointsEarned: number) {
  const { data: existing, error: fetchError } = await supabase
    .from('user_stats')
    .select('current_streak, longest_streak, total_points, last_answered_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to read user stats before update:', fetchError.message);
    return;
  }

  const today = toLocalISODate(new Date());
  const yesterday = toLocalISODate(new Date(Date.now() - 86_400_000));
  const previousStreak = existing?.current_streak ?? 0;

  let currentStreak: number;
  if (existing?.last_answered_date === today) {
    // Defensive: shouldn't happen since the UI blocks re-answering, but avoid
    // double-counting the streak if it ever does.
    currentStreak = existing.current_streak;
  } else if (existing?.last_answered_date === yesterday) {
    currentStreak = existing.current_streak + 1;
  } else {
    currentStreak = 1;
  }

  // Only an actual increment can land on a milestone — the "already answered
  // today" branch above leaves currentStreak === previousStreak, so it never
  // re-awards a bonus for a streak the user already got credit for.
  const streakBonus = currentStreak > previousStreak ? (STREAK_MILESTONE_BONUSES[currentStreak] ?? 0) : 0;

  const longestStreak = Math.max(existing?.longest_streak ?? 0, currentStreak);
  const totalPoints = (existing?.total_points ?? 0) + pointsEarned + streakBonus;

  const { error } = await supabase.from('user_stats').upsert(
    {
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_points: totalPoints,
      last_answered_date: today,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('Failed to update user stats:', error.message);
  }
}

export async function submitAnswer(
  userId: string,
  questionId: string,
  selectedIndex: number,
  isCorrect: boolean,
  pointsValue: number
) {
  const pointsEarned = isCorrect ? pointsValue : 0;

  const { error } = await supabase.from('user_answers').insert({
    user_id: userId,
    question_id: questionId,
    selected_choice: indexToLetter(selectedIndex),
    is_correct: isCorrect,
    points_earned: pointsEarned,
    answered_date: toLocalISODate(new Date()),
  });

  if (error) {
    console.error('Failed to submit the answer:', error.message);
    return;
  }

  await updateUserStatsAfterAnswer(userId, pointsEarned);
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('current_streak, longest_streak, total_points')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch user stats:', error.message);
    return { streak: 0, longestStreak: 0, score: 0 };
  }

  return {
    streak: data?.current_streak ?? 0,
    longestStreak: data?.longest_streak ?? 0,
    score: data?.total_points ?? 0,
  };
}

// Rolling 7-day window (not calendar-week) — matches "the last 7 days" rather
// than a fixed Mon-Sun range, so it reads sensibly no matter which day the
// recap notification fires on.
export async function getWeeklyRecapStats(userId: string): Promise<WeeklyRecapStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

  const [{ data, error }, { streak }] = await Promise.all([
    supabase.from('user_answers').select('is_correct').eq('user_id', userId).gte('answered_at', sevenDaysAgo.toISOString()),
    getUserStats(userId),
  ]);

  if (error || !data) {
    if (error) console.error('Failed to fetch weekly recap stats:', error.message);
    return { correctCount: 0, totalAnswered: 0, streak };
  }

  return {
    correctCount: data.filter((row) => row.is_correct).length,
    totalAnswered: data.length,
    streak,
  };
}

export function formatWeeklyRecapSummary(stats: WeeklyRecapStats): string {
  const streakPart = stats.streak > 0 ? ` · streak à ${stats.streak} j. 🔥` : '';
  return `Cette semaine : ${stats.correctCount}/${stats.totalAnswered} bonnes réponses${streakPart}`;
}

export async function getAnswerHistory(userId: string, limit = 30): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('user_answers')
    .select(
      'answered_at, is_correct, questions ( question_text, choice_a, choice_b, choice_c, choice_d, correct_choice, categories ( name ) )'
    )
    .eq('user_id', userId)
    .order('answered_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error('Failed to fetch answer history:', error.message);
    return [];
  }

  const today = toLocalISODate(new Date());
  return data.map((row: any) => {
    const answeredDate = toLocalISODate(parseUtcTimestamp(row.answered_at));
    const choices = [row.questions?.choice_a, row.questions?.choice_b, row.questions?.choice_c, row.questions?.choice_d];
    return {
      date: answeredDate === today ? "Aujourd'hui" : formatFrenchDate(answeredDate),
      category: row.questions?.categories?.name ?? '',
      snippet: row.questions?.question_text ?? '',
      word: choices[letterToIndex(row.questions?.correct_choice)] ?? '',
      correct: row.is_correct,
    };
  });
}
