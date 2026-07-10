-- Persist the recipient address so a failed send can be retried without
-- reopening the form.
alter table courriers add column destinataire text;
