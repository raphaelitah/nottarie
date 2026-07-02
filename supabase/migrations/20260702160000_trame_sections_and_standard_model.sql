-- Rename "paragraphs" to "sections" to match the trame domain language: a trame
-- belongs to exactly one type_acte, and is composed of one standard model plus
-- any number of optional, addable sections.
alter table trame_paragraphs rename to trame_sections;
alter index trame_paragraphs_branche_type_acte_idx rename to trame_sections_branche_type_acte_idx;
alter function set_trame_paragraphs_updated_at() rename to set_trame_sections_updated_at;
alter trigger trame_paragraphs_set_updated_at on trame_sections rename to trame_sections_set_updated_at;
alter policy "trame_paragraphs_platform_admin_all" on trame_sections rename to "trame_sections_platform_admin_all";

-- The standard model is the always-present base of a trame (one per type_acte);
-- it has no category since it isn't part of the addable-sections list.
alter table trame_sections add column is_standard boolean not null default false;
alter table trame_sections alter column category drop not null;
alter table trame_sections add constraint trame_sections_category_required_unless_standard
  check (is_standard or category is not null);

create unique index trame_sections_one_standard_per_type_acte
  on trame_sections (type_acte)
  where is_standard;
