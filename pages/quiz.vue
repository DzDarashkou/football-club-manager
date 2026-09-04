<script setup lang="ts">
import { ArrowRight, CircleHelp, Heart, RotateCcw, Sparkles, Trophy } from 'lucide-vue-next'
import type { QuizOptionKey } from '@@/types/quiz'

definePageMeta({
  layout: 'public',
  public: true,
})

const {
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
} = useQuiz()

const displayName = ref('')
const nameError = ref<string | null>(null)
const answerLabels: Record<QuizOptionKey, string> = { a: 'A', b: 'B', c: 'C', d: 'D' }
const difficultyLabels = { easy: 'Łatwe · 10 pkt', medium: 'Średnie · 20 pkt', hard: 'Trudne · 30 pkt' } as const

onMounted(loadLeaderboard)

function handleAnswer(selectedOption: QuizOptionKey) {
  void answerQuestion(selectedOption)
}

function handleContinue() {
  void continueQuiz()
}

async function handleLeaderboardSubmit() {
  const normalizedName = displayName.value.trim()
  if (normalizedName.length < 2 || normalizedName.length > 24) {
    nameError.value = 'Wpisz nazwę składającą się z 2–24 znaków.'
    return
  }

  nameError.value = null
  const submitted = await submitLeaderboard(normalizedName)
  if (submitted) displayName.value = ''
}
</script>

<template>
  <div class="space-y-5">
    <div v-if="phase === 'intro'" class="space-y-5">
      <section class="card overflow-hidden bg-brand-800 text-white">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="eyebrow text-brand-200">Sporting Wrocław</p>
            <h1 class="mt-1 text-white">Piłkarski quiz</h1>
          </div>
          <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
            <Sparkles class="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <p class="mt-4 text-sm leading-6 text-brand-100">
          Odpowiadaj na pytania od łatwych do trudnych. Masz trzy życia — po trzeciej pomyłce sprawdzimy Twój wynik.
        </p>
        <Button class="mt-5 w-full" variant="secondary" size="lg" :disabled="isLoading" @click="startQuiz">
          {{ isLoading ? 'Rozpoczynamy…' : 'Zagraj' }}
          <ArrowRight class="ml-2 h-5 w-5" aria-hidden="true" />
        </Button>
      </section>

      <QuizLeaderboard :entries="leaderboard" />
    </div>

    <template v-else>
      <section class="card">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow text-brand-700">Twój wynik</p>
            <p class="mt-1 text-2xl font-medium text-brand-800">{{ score }} pkt</p>
          </div>
          <div class="text-right">
            <p class="eyebrow text-brand-700">Życia</p>
            <div class="mt-1 flex justify-end gap-1" :aria-label="`Pozostałe życia: ${livesRemaining}`">
              <Heart
                v-for="life in 3"
                :key="life"
                class="h-5 w-5"
                :class="life <= livesRemaining ? 'fill-status-declined-bg text-status-declined-text' : 'text-gray-200'"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      <section v-if="phase === 'question' && question" class="card">
        <div class="flex items-center justify-between gap-3">
          <span class="badge-base badge-neutral">{{ difficultyLabels[question.difficulty] }}</span>
          <span class="text-xs text-[color:var(--color-text-secondary)]">{{ question.topic }}</span>
        </div>
        <h1 class="mt-5 text-xl leading-8">{{ question.question }}</h1>
        <div class="mt-6 grid gap-3">
          <button
            v-for="option in question.options"
            :key="option.key"
            type="button"
            class="flex min-h-[56px] w-full items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-wait disabled:opacity-60"
            :disabled="isLoading"
            @click="handleAnswer(option.key)"
          >
            <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs text-brand-800">{{ answerLabels[option.key] }}</span>
            <span>{{ option.text }}</span>
          </button>
        </div>
      </section>

      <section v-else-if="phase === 'feedback' && answerResult && question" class="card">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" :class="answerResult.is_correct ? 'bg-status-confirmed-bg text-status-confirmed-text' : 'bg-status-declined-bg text-status-declined-text'">
            <CircleHelp class="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p class="text-base font-medium text-foreground">{{ answerResult.is_correct ? `Brawo! +${answerResult.points_awarded} pkt` : 'Tym razem nie.' }}</p>
            <p v-if="!answerResult.is_correct" class="mt-1 text-sm text-[color:var(--color-text-secondary)]">
              Poprawna odpowiedź: {{ answerLabels[answerResult.correct_option] }} — {{ question.options.find((option) => option.key === answerResult?.correct_option)?.text }}
            </p>
          </div>
        </div>
        <p class="mt-5 text-sm leading-6 text-[color:var(--color-text-secondary)]">{{ answerResult.explanation }}</p>
        <Button class="mt-6 w-full" size="lg" :disabled="isLoading" @click="handleContinue">
          {{ answerResult.finished ? 'Zobacz wynik' : 'Następne pytanie' }}
          <ArrowRight class="ml-2 h-5 w-5" aria-hidden="true" />
        </Button>
      </section>

      <template v-else-if="phase === 'finished' && finalResult">
        <section class="card text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-pending-bg text-status-pending-text">
            <Trophy class="h-6 w-6" aria-hidden="true" />
          </div>
          <p class="eyebrow mt-4 text-brand-700">Koniec gry</p>
          <h1 class="mt-1">Twój wynik: {{ finalResult.score }} pkt</h1>
          <p class="mt-2 text-sm text-[color:var(--color-text-secondary)]">Wykorzystałeś wszystkie trzy życia. Spróbuj pobić swój wynik!</p>
        </section>

        <section v-if="qualifiesForLeaderboard" class="card border-brand-200 bg-brand-50">
          <h2>Jesteś w najlepszej dziesiątce!</h2>
          <p class="mt-2 text-sm text-[color:var(--color-text-secondary)]">Wpisz wybraną nazwę, aby zapisać wynik {{ finalResult.score }} pkt.</p>
          <form class="mt-4 space-y-3" @submit.prevent="handleLeaderboardSubmit">
            <Label for="quiz-display-name">Nazwa na tablicy wyników</Label>
            <Input id="quiz-display-name" v-model="displayName" maxlength="24" autocomplete="nickname" placeholder="np. Lewy10" :disabled="isLoading" />
            <p v-if="nameError" class="text-sm text-destructive" role="alert">{{ nameError }}</p>
            <Button class="w-full" type="submit" :disabled="isLoading">{{ isLoading ? 'Zapisuję…' : 'Zapisz wynik' }}</Button>
          </form>
        </section>

        <section v-else-if="leaderboardSubmitted" class="card border-status-confirmed-ring bg-status-confirmed-bg/30 text-center">
          <p class="font-medium text-status-confirmed-text">Wynik zapisany na tablicy!</p>
        </section>

        <QuizLeaderboard :entries="leaderboard" />
        <Button class="w-full" variant="outline" size="lg" :disabled="isLoading" @click="startQuiz">
          <RotateCcw class="mr-2 h-5 w-5" aria-hidden="true" />
          Zagraj ponownie
        </Button>
      </template>
    </template>

    <p v-if="errorMessage" class="rounded-lg bg-status-declined-bg/30 px-3 py-2 text-sm text-status-declined-text" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>
