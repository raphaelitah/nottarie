alter table signature_signataires
  add column ordre integer not null default 0;

create index signature_signataires_request_ordre_idx
  on signature_signataires (signature_request_id, ordre);
