create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('problem-documents', 'problem-documents', false)
on conflict (id) do update set public = false;

create policy "documents storage select own" on storage.objects
for select to authenticated
using (bucket_id = 'problem-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents storage insert own" on storage.objects
for insert to authenticated
with check (bucket_id = 'problem-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents storage update own" on storage.objects
for update to authenticated
using (bucket_id = 'problem-documents' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'problem-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents storage delete own" on storage.objects
for delete to authenticated
using (bucket_id = 'problem-documents' and (storage.foldername(name))[1] = auth.uid()::text);
