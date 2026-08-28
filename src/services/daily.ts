import { supabase } from './supabase';

export type DailyQuestion = {
  id: string;
  category: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source: string;
};

export type UserStats = {
  streak: number;
  score: number;
};

export type HistoryEntry = {
  date: string;
  category: string;
  snippet: string;
  correct: boolean;
};

const CHOICE_LETTERS = ['a', 'b', 'c', 'd'];
const POINTS_PER_CORRECT_ANSWER = 10;

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
  'id, question_text, choice_a, choice_b, choice_c, choice_d, correct_choice, explanation, source, created_at, categories ( name )';

function mapQuestionRow(row: any): DailyQuestion {
  return {
    id: row.id,
    category: row.categories?.name ?? '',
    text: row.question_text,
    options: [row.choice_a, row.choice_b, row.choice_c, row.choice_d],
    correctIndex: letterToIndex(row.correct_choice),
    explanation: row.explanation,
    source: row.source ?? '',
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

export async function getTodayQuestion(): Promise<DailyQuestion | null> {
  const { data, error } = await supabase
    .from('questions')
    .select(QUESTION_COLUMNS)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

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

export async function getAnswerFor(
  userId: string,
  questionId: string
): Promise<{ selectedIndex: number } | null> {
  const { data, error } = await supabase
    .from('user_answers')
    .select('selected_choice')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch today's answer:", error.message);
    return null;
  }
  return data ? { selectedIndex: letterToIndex(data.selected_choice) } : null;
}

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

  const longestStreak = Math.max(existing?.longest_streak ?? 0, currentStreak);
  const totalPoints = (existing?.total_points ?? 0) + pointsEarned;

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
  isCorrect: boolean
) {
  const pointsEarned = isCorrect ? POINTS_PER_CORRECT_ANSWER : 0;

  const { error } = await supabase.from('user_answers').insert({
    user_id: userId,
    question_id: questionId,
    selected_choice: indexToLetter(selectedIndex),
    is_correct: isCorrect,
    points_earned: pointsEarned,
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
    .select('current_streak, total_points')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch user stats:', error.message);
    return { streak: 0, score: 0 };
  }

  return { streak: data?.current_streak ?? 0, score: data?.total_points ?? 0 };
}

export async function getAnswerHistory(userId: string, limit = 30): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('user_answers')
    .select('answered_at, is_correct, questions ( question_text, categories ( name ) )')
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
    return {
      date: answeredDate === today ? "Aujourd'hui" : formatFrenchDate(answeredDate),
      category: row.questions?.categories?.name ?? '',
      snippet: row.questions?.question_text ?? '',
      correct: row.is_correct,
    };
  });
}
