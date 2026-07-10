-- Courriers can now be addressed to multiple recipients (comparants and/or
-- other étude contacts), not just one. `destinataire` (singular) stays for
-- now as the first recipient, kept in sync for any code that still reads it.
alter table courriers add column destinataires text[] not null default '{}';
