create type public.quiz_difficulty as enum ('easy', 'medium', 'hard');

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null,
  difficulty public.quiz_difficulty not null,
  topic text not null,
  explanation text not null,
  source_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint quiz_questions_correct_option_check check (correct_option in ('a', 'b', 'c', 'd')),
  constraint quiz_questions_options_not_blank_check check (
    length(btrim(option_a)) > 0
    and length(btrim(option_b)) > 0
    and length(btrim(option_c)) > 0
    and length(btrim(option_d)) > 0
  )
);

create index quiz_questions_active_difficulty_idx
on public.quiz_questions (difficulty)
where is_active;

create trigger set_quiz_questions_updated_at
before update on public.quiz_questions
for each row execute function public.set_current_timestamp_updated_at();

create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  score integer not null default 0 check (score >= 0),
  lives_remaining smallint not null default 3 check (lives_remaining between 0 and 3),
  status text not null default 'in_progress' check (status in ('in_progress', 'finished', 'leaderboard_submitted')),
  current_question_id uuid references public.quiz_questions (id) on delete set null,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  leaderboard_submitted_at timestamptz,
  expires_at timestamptz not null default timezone('utc', now()) + interval '2 hours',
  constraint quiz_sessions_finished_at_check check (
    (status = 'in_progress' and finished_at is null)
    or (status in ('finished', 'leaderboard_submitted') and finished_at is not null)
  )
);

create index quiz_sessions_expires_at_idx on public.quiz_sessions (expires_at);

create table public.quiz_session_questions (
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  question_id uuid not null references public.quiz_questions (id) on delete restrict,
  sequence_number smallint not null check (sequence_number > 0),
  selected_option text,
  is_correct boolean,
  points_awarded smallint not null default 0 check (points_awarded in (0, 10, 20, 30)),
  presented_at timestamptz not null default timezone('utc', now()),
  answered_at timestamptz,
  primary key (session_id, question_id),
  unique (session_id, sequence_number),
  constraint quiz_session_questions_selected_option_check check (selected_option is null or selected_option in ('a', 'b', 'c', 'd')),
  constraint quiz_session_questions_answer_state_check check (
    (answered_at is null and selected_option is null and is_correct is null and points_awarded = 0)
    or (answered_at is not null and selected_option is not null and is_correct is not null)
  )
);

create table public.quiz_leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  score integer not null check (score >= 0),
  correct_answers smallint not null check (correct_answers >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint quiz_leaderboard_entries_display_name_check check (
    char_length(btrim(display_name)) between 2 and 24
    and display_name ~ '^[[:alnum:]ĄĆĘŁŃÓŚŹŻąćęłńóśźż ''-]+$'
  )
);

create index quiz_leaderboard_entries_rank_idx
on public.quiz_leaderboard_entries (score desc, created_at asc);

alter table public.quiz_questions enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_session_questions enable row level security;
alter table public.quiz_leaderboard_entries enable row level security;

create policy "Anyone can read quiz leaderboard entries"
on public.quiz_leaderboard_entries
for select to anon, authenticated
using (true);

create or replace function public.draw_quiz_question(p_session_id uuid)
returns table (
  id uuid,
  question text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  difficulty public.quiz_difficulty,
  topic text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.quiz_sessions%rowtype;
  v_question_id uuid;
  v_sequence_number smallint;
  v_difficulty public.quiz_difficulty;
begin
  select * into v_session
  from public.quiz_sessions
  where quiz_sessions.id = p_session_id
  for update;

  if not found or v_session.status <> 'in_progress' or v_session.expires_at <= timezone('utc', now()) then
    raise exception 'Quiz session is unavailable.' using errcode = 'P0001';
  end if;

  if v_session.current_question_id is not null then
    raise exception 'Answer the current question first.' using errcode = 'P0001';
  end if;

  select count(*)::smallint + 1 into v_sequence_number
  from public.quiz_session_questions
  where session_id = p_session_id;

  v_difficulty := case
    when v_sequence_number <= 5 then 'easy'::public.quiz_difficulty
    when v_sequence_number <= 10 then 'medium'::public.quiz_difficulty
    else 'hard'::public.quiz_difficulty
  end;

  select q.id into v_question_id
  from public.quiz_questions q
  where q.is_active
    and q.difficulty = v_difficulty
    and not exists (
      select 1
      from public.quiz_session_questions
      where session_id = p_session_id
        and question_id = q.id
    )
  order by random()
  limit 1;

  if v_question_id is null then
    update public.quiz_sessions
    set status = 'finished',
        finished_at = timezone('utc', now())
    where quiz_sessions.id = p_session_id;

    return;
  end if;

  insert into public.quiz_session_questions (session_id, question_id, sequence_number)
  values (p_session_id, v_question_id, v_sequence_number);

  update public.quiz_sessions
  set current_question_id = v_question_id
  where quiz_sessions.id = p_session_id;

  return query
  select q.id, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.difficulty, q.topic
  from public.quiz_questions q
  where q.id = v_question_id;
end;
$$;

create or replace function public.answer_quiz_question(
  p_session_id uuid,
  p_question_id uuid,
  p_selected_option text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.quiz_sessions%rowtype;
  v_question public.quiz_questions%rowtype;
  v_is_correct boolean;
  v_points smallint := 0;
  v_lives_remaining smallint;
  v_score integer;
  v_finished boolean := false;
begin
  select * into v_session
  from public.quiz_sessions
  where quiz_sessions.id = p_session_id
  for update;

  if not found or v_session.status <> 'in_progress' or v_session.expires_at <= timezone('utc', now()) then
    raise exception 'Quiz session is unavailable.' using errcode = 'P0001';
  end if;

  if v_session.current_question_id is distinct from p_question_id then
    raise exception 'This is not the current quiz question.' using errcode = 'P0001';
  end if;

  if p_selected_option not in ('a', 'b', 'c', 'd') then
    raise exception 'Invalid answer option.' using errcode = 'P0001';
  end if;

  select * into v_question
  from public.quiz_questions
  where id = p_question_id;

  if not found then
    raise exception 'Quiz question was not found.' using errcode = 'P0001';
  end if;

  v_is_correct := v_question.correct_option = p_selected_option;
  if v_is_correct then
    v_points := case v_question.difficulty
      when 'easy' then 10
      when 'medium' then 20
      when 'hard' then 30
    end;
  end if;

  v_lives_remaining := v_session.lives_remaining - case when v_is_correct then 0 else 1 end;
  v_finished := v_lives_remaining = 0;
  v_score := greatest(0, v_session.score + v_points - case when v_is_correct then 0 else 30 end);

  update public.quiz_session_questions
  set selected_option = p_selected_option,
      is_correct = v_is_correct,
      points_awarded = v_points,
      answered_at = timezone('utc', now())
  where session_id = p_session_id
    and question_id = p_question_id
    and answered_at is null;

  if not found then
    raise exception 'This question was already answered.' using errcode = 'P0001';
  end if;

  update public.quiz_sessions
  set score = v_score,
      lives_remaining = v_lives_remaining,
      current_question_id = null,
      status = case when v_finished then 'finished' else 'in_progress' end,
      finished_at = case when v_finished then timezone('utc', now()) else null end
  where id = p_session_id;

  return jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_option', v_question.correct_option,
    'explanation', v_question.explanation,
    'points_awarded', v_points,
    'score', v_score,
    'lives_remaining', v_lives_remaining,
    'finished', v_finished
  );
end;
$$;

create or replace function public.submit_quiz_leaderboard_entry(
  p_session_id uuid,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.quiz_sessions%rowtype;
  v_display_name text := btrim(p_display_name);
  v_correct_answers smallint;
  v_lowest_score integer;
  v_entry_count integer;
begin
  if char_length(v_display_name) not between 2 and 24
    or v_display_name !~ '^[[:alnum:]ĄĆĘŁŃÓŚŹŻąćęłńóśźż ''-]+$' then
    raise exception 'Enter a name between 2 and 24 characters.' using errcode = 'P0001';
  end if;

  select * into v_session
  from public.quiz_sessions
  where quiz_sessions.id = p_session_id
  for update;

  if not found or v_session.status <> 'finished' or v_session.expires_at <= timezone('utc', now()) then
    raise exception 'This quiz result cannot be submitted.' using errcode = 'P0001';
  end if;

  lock table public.quiz_leaderboard_entries in share row exclusive mode;

  select count(*) into v_entry_count from public.quiz_leaderboard_entries;
  select score into v_lowest_score
  from public.quiz_leaderboard_entries
  order by score asc, created_at desc, id desc
  limit 1;

  if v_entry_count >= 10 and v_session.score <= v_lowest_score then
    return jsonb_build_object('submitted', false, 'qualifies', false);
  end if;

  select count(*)::smallint into v_correct_answers
  from public.quiz_session_questions
  where session_id = p_session_id and is_correct;

  insert into public.quiz_leaderboard_entries (display_name, score, correct_answers)
  values (v_display_name, v_session.score, v_correct_answers);

  delete from public.quiz_leaderboard_entries
  where id in (
    select id
    from public.quiz_leaderboard_entries
    order by score desc, created_at asc, id asc
    offset 10
  );

  update public.quiz_sessions
  set status = 'leaderboard_submitted',
      leaderboard_submitted_at = timezone('utc', now())
  where id = p_session_id;

  return jsonb_build_object('submitted', true, 'qualifies', true);
end;
$$;

revoke all on function public.draw_quiz_question(uuid) from public;
revoke all on function public.answer_quiz_question(uuid, uuid, text) from public;
revoke all on function public.submit_quiz_leaderboard_entry(uuid, text) from public;
grant execute on function public.draw_quiz_question(uuid) to service_role;
grant execute on function public.answer_quiz_question(uuid, uuid, text) to service_role;
grant execute on function public.submit_quiz_leaderboard_entry(uuid, text) to service_role;

insert into public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_option, difficulty, topic, explanation) values
  ('Ilu zawodników jednej drużyny jest na boisku na początku meczu?', '9', '10', '11', '12', 'c', 'easy', 'zasady', 'Na boisku gra jednocześnie 11 zawodników jednej drużyny, w tym bramkarz.'),
  ('Ile minut trwa podstawowy czas meczu piłki nożnej?', '60 minut', '80 minut', '90 minut', '100 minut', 'c', 'easy', 'zasady', 'Mecz składa się z dwóch połów po 45 minut. Sędzia może doliczyć czas.'),
  ('Który zawodnik jako jedyny może łapać piłkę rękami w swoim polu karnym?', 'Napastnik', 'Bramkarz', 'Kapitan', 'Obrońca', 'b', 'easy', 'zasady', 'Bramkarz może używać rąk w swoim własnym polu karnym.'),
  ('Jaką karę oznacza czerwona kartka?', 'Rzut rożny', 'Zmianę zawodnika', 'Wykluczenie z meczu', 'Rzut wolny pośredni', 'c', 'easy', 'zasady', 'Po czerwonej kartce zawodnik opuszcza boisko, a drużyna gra w osłabieniu.'),
  ('Skąd wykonuje się rzut rożny?', 'Ze środka boiska', 'Z narożnika boiska', 'Z pola karnego', 'Z linii bramkowej', 'b', 'easy', 'zasady', 'Rzut rożny wykonuje się z łuku w narożniku boiska.'),
  ('Która część ciała nie może służyć zawodnikowi z pola do celowego zagrania piłki?', 'Głowa', 'Stopa', 'Ręka', 'Klatka piersiowa', 'c', 'easy', 'zasady', 'Zawodnicy z pola nie mogą celowo grać piłki ręką lub ramieniem.'),
  ('Jak nazywa się zdobycie trzech bramek przez jednego zawodnika w meczu?', 'Hat-trick', 'Dogrywka', 'Spalony', 'Pressing', 'a', 'easy', 'ciekawostki', 'Trzy gole jednego zawodnika w jednym meczu to hat-trick.'),
  ('Co oznacza wynik 0:0?', 'Wygraną gospodarzy', 'Remis bez bramek', 'Koniec turnieju', 'Rzut karny', 'b', 'easy', 'zasady', 'Gdy żadna drużyna nie strzeli gola, wynik meczu to remis 0:0.'),
  ('Jak nazywa się strzał wykonywany z 11 metrów po faulu w polu karnym?', 'Rzut z autu', 'Rzut karny', 'Rzut rożny', 'Rzut sędziowski', 'b', 'easy', 'zasady', 'Rzut karny wykonuje się z punktu karnego, który jest 11 metrów od bramki.'),
  ('Który kolor kartki jest ostrzeżeniem?', 'Żółty', 'Niebieski', 'Zielony', 'Biały', 'a', 'easy', 'zasady', 'Żółta kartka jest ostrzeżeniem dla zawodnika.'),
  ('Jak nazywa się rozpoczęcie gry ze środka boiska?', 'Wrzut', 'Wykop', 'Rzut rożny', 'Rozpoczęcie gry', 'd', 'easy', 'zasady', 'Mecz, druga połowa i gra po golu zaczynają się ze środka boiska.'),
  ('Co zdobywa drużyna, gdy piłka całym obwodem przekroczy linię bramkową między słupkami?', 'Aut', 'Gol', 'Rzut wolny', 'Spalony', 'b', 'easy', 'zasady', 'Gol jest uznany, gdy piłka całkowicie przekroczy linię bramkową.'),
  ('Czy zawodnik może być na spalonym na własnej połowie boiska?', 'Tak, zawsze', 'Nie', 'Tylko po rzucie rożnym', 'Tylko bramkarz', 'b', 'medium', 'zasady', 'Pozycja spalona nie jest możliwa na własnej połowie boiska.'),
  ('Ile metrów od bramki znajduje się punkt karny?', '7 metrów', '9 metrów', '11 metrów', '16 metrów', 'c', 'medium', 'zasady', 'Punkt karny jest oddalony o 11 metrów od linii bramkowej.'),
  ('Co oznacza ustawienie 4-3-3?', 'Czterech bramkarzy, trzech obrońców i trzech napastników', 'Czterech obrońców, trzech pomocników i trzech napastników', 'Czterech napastników, trzech pomocników i trzech obrońców', 'Liczbę zmian w meczu', 'b', 'medium', 'taktyka', 'Zapis formacji opisuje zwykle zawodników z pola: obrońców, pomocników i napastników.'),
  ('Jaki jest główny cel wysokiego pressingu?', 'Oddać piłkę rywalowi', 'Szybko odebrać piłkę blisko bramki rywala', 'Przedłużyć przerwę', 'Ustawić się przy własnej bramce', 'b', 'medium', 'taktyka', 'Wysoki pressing ma utrudnić rywalowi wyprowadzenie piłki i odzyskać ją wysoko.'),
  ('Co dzieje się, gdy piłka całym obwodem opuści boisko przez linię boczną?', 'Jest rzut z autu', 'Jest rzut karny', 'Mecz się kończy', 'Jest gol', 'a', 'medium', 'zasady', 'Gdy piłka przekroczy linię boczną, przeciwnik wykonuje wrzut z autu.'),
  ('Która pozycja najczęściej łączy obronę z atakiem i odbiera piłki w środku pola?', 'Bramkarz', 'Środkowy pomocnik defensywny', 'Skrzydłowy', 'Napastnik', 'b', 'medium', 'taktyka', 'Defensywny pomocnik pomaga osłaniać obronę i rozpoczynać ataki.'),
  ('Kiedy sędzia może doliczyć czas gry?', 'Tylko po golu', 'Gdy były przerwy, na przykład leczenie kontuzji lub zmiany', 'Nigdy', 'Tylko przed meczem', 'b', 'medium', 'zasady', 'Czas doliczony rekompensuje przerwy podczas połowy.'),
  ('Jak nazywa się szybki atak po odebraniu piłki rywalowi?', 'Kontratak', 'Spalony', 'Wrzut', 'Mur', 'a', 'medium', 'taktyka', 'Kontratak wykorzystuje moment, gdy rywal jest jeszcze ustawiony wysoko lub nie jest gotowy do obrony.'),
  ('Co oznacza skrót VAR w piłce nożnej?', 'Wideoasystent sędziego', 'Wartość ataku rywala', 'Wirtualna arena rozgrywek', 'Wynik aktywnej rundy', 'a', 'medium', 'zasady', 'VAR pomaga sędziemu analizować wybrane ważne sytuacje za pomocą nagrań wideo.'),
  ('Dlaczego zawodnik może podać piłkę do tyłu, zamiast zawsze atakować?', 'Aby utrzymać piłkę i znaleźć lepszą drogę do przodu', 'Ponieważ nie wolno podawać do przodu', 'Aby automatycznie zdobyć punkt', 'Ponieważ wtedy nie ma spalonego', 'a', 'medium', 'taktyka', 'Podanie do tyłu może pomóc zachować kontrolę i zmienić stronę ataku.'),
  ('Co oznacza krycie strefowe w obronie?', 'Każdy obrońca pilnuje wyłącznie jednego zawodnika przez cały mecz', 'Obrońcy odpowiadają za określone przestrzenie boiska', 'Bramkarz kryje wszystkich', 'Drużyna nie broni rzutów rożnych', 'b', 'medium', 'taktyka', 'W kryciu strefowym zawodnicy bronią swojej strefy i reagują na rywali, którzy do niej wchodzą.'),
  ('Która drużyna rozpoczęła pierwszy w historii mundial w 1930 roku jako gospodarz?', 'Brazylia', 'Urugwaj', 'Włochy', 'Anglia', 'b', 'hard', 'historia', 'Pierwsze mistrzostwa świata odbyły się w 1930 roku w Urugwaju, który także je wygrał.'),
  ('W którym roku powstał The Football Association w Anglii, który spisał pierwsze nowoczesne przepisy piłki nożnej?', '1803', '1863', '1904', '1930', 'b', 'hard', 'historia', 'The Football Association powstało w 1863 roku i odegrało ważną rolę w ujednoliceniu zasad gry.'),
  ('Co w taktyce oznacza określenie „half-space”?', 'Przestrzeń między linią boczną a środkiem boiska', 'Miejsce wyłącznie dla bramkarza', 'Połowę pola karnego', 'Przerwę między połowami', 'a', 'hard', 'taktyka', 'Half-space to pas boiska między centralnym korytarzem a skrzydłem, bardzo przydatny do tworzenia przewagi.'),
  ('Co robi „fałszywa dziewiątka”?', 'Zawsze stoi przy własnej bramce', 'Napastnik często cofa się do środka pola, by tworzyć miejsce i łączyć grę', 'To drugi bramkarz', 'Wykonuje tylko rzuty rożne', 'b', 'hard', 'taktyka', 'Fałszywa dziewiątka nie czeka stale najwyżej; schodzi głębiej, aby wyciągać obrońców i tworzyć wolne przestrzenie.'),
  ('Jaki przepis ograniczył podanie do własnego bramkarza rękami i zmienił sposób gry w 1992 roku?', 'Bramkarz nie może chwytać rękami celowego podania nogą od kolegi', 'Nie wolno podawać do bramkarza', 'Bramkarz nie może używać nóg', 'Nie wolno grać w obronie', 'a', 'hard', 'historia', 'Od 1992 roku bramkarz nie może chwycić rękami celowego podania nogą od partnera z drużyny.'),
  ('Co oznacza „kontrpressing”?', 'Natychmiastową próbę odebrania piłki po jej stracie', 'Obronę tylko w polu karnym', 'Zmianę strony przez bramkarza', 'Rzut rożny wykonywany szybko', 'a', 'hard', 'taktyka', 'Kontrpressing polega na szybkim pressingu tuż po stracie piłki, zanim rywal rozpocznie kontratak.'),
  ('Dlaczego zespół tworzy przewagę liczebną po jednej stronie boiska?', 'Aby łatwiej znaleźć wolnego zawodnika i połączyć podania', 'Aby zmniejszyć liczbę podań', 'Aby sędzia przerwał mecz', 'Aby uniknąć zmian', 'a', 'hard', 'taktyka', 'Kilku zawodników blisko siebie może przyciągnąć obrońców i uwolnić przestrzeń w innym miejscu.'),
  ('Co oznacza „podwójna szóstka” w formacji?', 'Dwóch pomocników ustawionych głębiej przed obroną', 'Sześciu napastników', 'Dwie czerwone kartki', 'Dwa rzuty karne', 'a', 'hard', 'taktyka', 'Podwójna szóstka to para defensywnych lub centralnych pomocników, którzy wspierają obronę i rozegranie.'),
  ('W którym roku po raz pierwszy pokazano żółte i czerwone kartki na mistrzostwach świata?', '1954', '1966', '1970', '1982', 'c', 'hard', 'historia', 'System żółtych i czerwonych kartek został użyty na mistrzostwach świata po raz pierwszy w 1970 roku.'),
  ('Co jest celem odwróconego bocznego obrońcy podczas ataku?', 'Wejść ze skrzydła do środka pola i pomóc w rozegraniu', 'Zawsze zostać przy chorągiewce rożnej', 'Nie brać udziału w ataku', 'Stać obok bramkarza rywala', 'a', 'hard', 'taktyka', 'Odwrócony boczny obrońca schodzi do środka, aby dać drużynie dodatkowego pomocnika.'),
  ('Który zespół zdobył pierwsze oficjalne mistrzostwo świata w piłce nożnej?', 'Urugwaj', 'Argentyna', 'Niemcy', 'Francja', 'a', 'hard', 'historia', 'Urugwaj wygrał finał pierwszych mistrzostw świata w 1930 roku z Argentyną.'),
  ('Po co obrońca może „wyprowadzić” napastnika poza linię obrony podczas krycia?', 'Aby złapać go na spalonym', 'Aby dać mu więcej miejsca', 'Aby skończyć mecz', 'Aby zdobyć rzut rożny', 'a', 'hard', 'taktyka', 'Dobrze ustawiona linia obrony może sprawić, że atakujący znajdzie się na pozycji spalonej.')
;
