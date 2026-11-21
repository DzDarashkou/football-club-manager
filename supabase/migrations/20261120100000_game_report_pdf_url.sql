-- Add report_pdf_url to public.games for downloadable PDF match reports (e.g. Google Drive links)

alter table public.games
  add column if not exists report_pdf_url text;

alter table public.games
  drop constraint if exists games_report_pdf_url_check;

alter table public.games
  add constraint games_report_pdf_url_check check (
    report_pdf_url is null or report_pdf_url ~* '^https?://[^[:space:]]+$'
  );
