drop policy if exists "utilisateurs_insert_admin" on utilisateurs;

create policy "utilisateurs_insert_authenticated" on utilisateurs
  for insert to authenticated
  with check (true);
