-- Finish the session when the current difficulty has no unused questions left.
-- This makes the existing leaderboard submission RPC available to the player.
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
