import { computed, ref } from 'vue'
import type { QuizAnswerResult, QuizLeaderboardEntry, QuizOptionKey, QuizQuestion } from '@@/types/quiz'

type QuizPhase = 'intro' | 'question' | 'feedback' | 'finished'

type StartQuizResponse = {
  question: QuizQuestion
  score: number
  lives_remaining: number
}

type AnswerQuizResponse = { result: QuizAnswerResult }
type NextQuizResponse = { question: QuizQuestion }
type LeaderboardResponse = { entries: QuizLeaderboardEntry[] }
type SubmitLeaderboardResponse = { submitted: boolean, qualifies: boolean }

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = error.data
    if (typeof data === 'object' && data !== null && 'statusMessage' in data && typeof data.statusMessage === 'string') {
      return data.statusMessage
    }
  }

  return fallback
}

export function useQuiz() {
  const phase = ref<QuizPhase>('intro')
  const question = ref<QuizQuestion | null>(null)
  const answerResult = ref<QuizAnswerResult | null>(null)
  const leaderboard = ref<QuizLeaderboardEntry[]>([])
  const score = ref(0)
  const livesRemaining = ref(3)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const leaderboardSubmitted = ref(false)

  const finalResult = computed(() => answerResult.value?.finished ? answerResult.value : null)
  const qualifiesForLeaderboard = computed(() => {
    if (!finalResult.value || leaderboardSubmitted.value) return false
    const tenthPlace = leaderboard.value[9]
    return !tenthPlace || finalResult.value.score > tenthPlace.score
  })

  async function loadLeaderboard() {
    try {
      const response = await $fetch<LeaderboardResponse>('/api/quiz/leaderboard')
      leaderboard.value = response.entries
    }
    catch (error) {
      errorMessage.value = getErrorMessage(error, 'Nie udało się pobrać tabeli wyników.')
    }
  }

  async function startQuiz() {
    isLoading.value = true
    errorMessage.value = null
    answerResult.value = null
    leaderboardSubmitted.value = false

    try {
      const response = await $fetch<StartQuizResponse>('/api/quiz/start', { method: 'POST' })
      question.value = response.question
      score.value = response.score
      livesRemaining.value = response.lives_remaining
      phase.value = 'question'
    }
    catch (error) {
      errorMessage.value = getErrorMessage(error, 'Nie udało się rozpocząć quizu.')
    }
    finally {
      isLoading.value = false
    }
  }

  async function answerQuestion(selectedOption: QuizOptionKey) {
    if (!question.value || isLoading.value || phase.value !== 'question') return

    isLoading.value = true
    errorMessage.value = null
    try {
      const response = await $fetch<AnswerQuizResponse>('/api/quiz/answer', {
        method: 'POST',
        body: {
          question_id: question.value.id,
          selected_option: selectedOption,
        },
      })
      answerResult.value = response.result
      score.value = response.result.score
      livesRemaining.value = response.result.lives_remaining
      phase.value = 'feedback'

      if (response.result.finished) {
        await loadLeaderboard()
      }
    }
    catch (error) {
      errorMessage.value = getErrorMessage(error, 'Nie udało się sprawdzić odpowiedzi.')
    }
    finally {
      isLoading.value = false
    }
  }

  async function continueQuiz() {
    if (!answerResult.value) return
    if (answerResult.value.finished) {
      phase.value = 'finished'
      return
    }

    isLoading.value = true
    errorMessage.value = null
    try {
      const response = await $fetch<NextQuizResponse>('/api/quiz/next', { method: 'POST' })
      question.value = response.question
      answerResult.value = null
      phase.value = 'question'
    }
    catch (error) {
      errorMessage.value = getErrorMessage(error, 'Nie udało się pobrać kolejnego pytania.')
    }
    finally {
      isLoading.value = false
    }
  }

  async function submitLeaderboard(displayName: string): Promise<boolean> {
    if (!qualifiesForLeaderboard.value || isLoading.value) return false

    isLoading.value = true
    errorMessage.value = null
    try {
      const response = await $fetch<SubmitLeaderboardResponse>('/api/quiz/leaderboard', {
        method: 'POST',
        body: { display_name: displayName },
      })
      leaderboardSubmitted.value = response.submitted
      await loadLeaderboard()

      if (!response.submitted) {
        errorMessage.value = 'Ten wynik właśnie przestał mieścić się w najlepszej dziesiątce.'
      }

      return response.submitted
    }
    catch (error) {
      errorMessage.value = getErrorMessage(error, 'Nie udało się zapisać wyniku.')
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    answerQuestion,
    answerResult,
    continueQuiz,
    errorMessage,
    finalResult,
    isLoading,
    leaderboard,
    leaderboardSubmitted,
    livesRemaining,
    loadLeaderboard,
    phase,
    qualifiesForLeaderboard,
    question,
    score,
    startQuiz,
    submitLeaderboard,
  }
}
