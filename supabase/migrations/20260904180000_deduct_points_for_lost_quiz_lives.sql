-- Every incorrect answer costs one life and 30 points, without allowing a negative score.
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
