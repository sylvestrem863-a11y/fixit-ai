alter table public.documents
  add column if not exists ai_analysis jsonb,
  add column if not exists analysis_status text not null default 'not_analyzed'
    check (analysis_status in ('not_analyzed','processing','completed','failed')),
  add column if not exists analyzed_at timestamptz;

create index if not exists documents_analysis_status_idx
  on public.documents(analysis_status);
