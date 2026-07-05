-- ============================================================
-- An acte's signature is not just the parties: the notaire must sign too
-- (and a deceased comparant can't). Widen signature_signataires so a row
-- can designate either a comparant ('partie') or the dossier's notaire
-- ('notaire'), instead of assuming every signataire is a comparant.
-- ============================================================
alter table signature_signataires
  add column role text not null default 'partie' check (role in ('partie', 'notaire')),
  add column utilisateur_id uuid references utilisateurs(id),
  alter column comparant_id drop not null;

alter table signature_signataires alter column role drop default;

alter table signature_signataires drop constraint signature_signataires_signature_request_id_comparant_id_key;

alter table signature_signataires add constraint signature_signataires_role_target_check
  check (
    (role = 'partie' and comparant_id is not null and utilisateur_id is null)
    or (role = 'notaire' and utilisateur_id is not null and comparant_id is null)
  );

-- At most one row per comparant per request, and at most one notaire per request.
create unique index signature_signataires_partie_unique
  on signature_signataires (signature_request_id, comparant_id) where role = 'partie';
create unique index signature_signataires_notaire_unique
  on signature_signataires (signature_request_id) where role = 'notaire';
