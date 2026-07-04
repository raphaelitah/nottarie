-- The `actes.trame_id` FK expects a row in `trames`, but the trame content model
-- moved to `trame_sections` (keyed by type_acte) before any `trames` rows were ever
-- seeded. Add one national trame per MVP type_acte so acte generation has something
-- to reference.
insert into trames (branche, type_acte, nom)
values
  ('famille', 'succession', 'Succession'),
  ('famille', 'donation', 'Donation');

-- trame_sections was platform-admin-only (authoring surface only). Acte generation
-- needs étude members to read published sections — to pick optional sections to
-- include, and to know which champ variables to collect — so add a read policy for
-- any authenticated user, scoped to published content only. Drafts stay admin-only.
create policy "trame_sections_select_published" on trame_sections
  for select to authenticated
  using (is_published = true);
