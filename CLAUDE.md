# Nottarie — Project Guide

## Git workflow

Work directly on `main`. Commit and push straight to `main` — no feature branches, no PRs. This is a solo project, so there's no review step to gate on.

Nottarie is a SaaS product for managing a French notarial office (étude notariale): case files (dossiers), people, properties, deed/document generation from templates (trames), electronic signature and AAE (Acte Authentique Électronique) production, and interconnection with the French notarial network (ADSN/MICEN).

This file encodes the product and architecture decisions from the BRD (Business Requirements Document) and ADR (Architecture Decision Records). It is a prototyping-phase fork of ADR-01: **Supabase replaces Django/django-tenants**, with row-level multi-tenancy instead of schema-per-tenant. Treat the deviations below as authoritative over the original ADR-01 stack choice; everything else in the ADR/BRD still applies.

## Stack (current — prototype)

| Component | Choice | Notes |
|---|---|---|
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + RLS) | Replaces Django/DRF + django-tenants for the prototype. |
| Multi-tenancy | Row-level, via `tenant_id` column + Row-Level Security policies | Replaces schema-per-tenant. Every tenant-scoped table carries `tenant_id` and is locked down with RLS — see "Multi-tenancy" below. |
| Frontend | React, TypeScript | Browser-only access (ENF-09), no heavy install. |
| Document generation | Python service using `docxtpl` (Jinja2-in-.docx), called by the frontend over HTTP | **Not** embedded in Supabase Edge Functions — see "Document generation service" below. |
| Storage (GED) | Supabase Storage (S3-compatible), EU region | Covers BRD 4.14 and CRH-01 (EU hosting). |
| Signature | Abstracted behind a `SignatureProvider` interface (ADR-02), mock implementation until ADSN specs (EI-12) are received | Unchanged from ADR-02. |

Original ADR-01 (Django, django-tenants, Docker Compose) describes the eventual/alternative target architecture if the project moves off Supabase. Do not assume Django conventions apply here.

## Multi-tenancy: row-level via `tenant_id` + RLS

- Tenant = `Etude` (the notarial office). One row per étude in an `etudes` table.
- Every tenant-scoped table (dossiers, personnes, immeubles, actes, trames-customizations, documents, emails, evenements, historique, utilisateurs, etc.) has a `tenant_id uuid not null references etudes(id)`.
- RLS is mandatory on every tenant-scoped table. Policies must filter on `tenant_id` matching the requesting user's étude (derived from their JWT/auth claims, e.g. a custom claim or a lookup against a `user_etudes` membership table).
- Never rely on application-layer filtering alone to enforce tenant isolation — RLS is the isolation boundary (ENF-01). Application code may add `tenant_id` filters for clarity/performance, but the database must enforce it independently.
- Shared, non-tenant-scoped data lives in tables with **no** `tenant_id` and is exposed to all tenants (read-only from the tenant's perspective): the national trame library and the national barème (fee schedule). These correspond to the "public schema" concept in ADR-01 — under row-level multi-tenancy this is just "tables without a `tenant_id` column," not a separate Postgres schema.
- Per-étude customization of a shared trame (EF-ADM-05) is stored as a tenant-scoped override row referencing the shared trame, not a copy-on-write of the shared table.
- Migrations apply once (no per-schema migration fan-out like django-tenants required) — this is one of the practical benefits of choosing row-level multi-tenancy for the prototype phase.

## Document generation service

- All `docxtpl` (python-docx-template, Jinja2 syntax) logic lives in a **standalone Python service**, separate from the Supabase project.
- The React frontend calls this service directly (HTTP API) to generate documents (actes, courriers, attestations) from `.docx` trames and dossier data — it is not proxied through, or embedded in, a Supabase Edge Function.
- Rationale: Edge Functions run on Deno, not Python, and have constraints (cold starts, execution limits, no native Python ecosystem) that are a poor fit for docxtpl's templating engine. Keeping it a separate service also keeps the door open to swap/scale it independently of Supabase.
- The service should be stateless: it receives trame + JSON data (or fetches trame/data via Supabase using a service-role or scoped token) and returns the rendered document. It must still respect tenant isolation — never accept a tenant_id from an untrusted client without validating it against the caller's authenticated session/JWT.
- Trame library and templates remain in `.docx` files with `{{ field }}` and `{% if %}` Jinja2 syntax (ADR-01 §2.3) — this format choice is unaffected by the Supabase switch.

## Domain model (from ADR-03, unaffected by the Supabase switch)

Core entities and key relations:
- **Etude** — tenant root. Holds official info (EF-ADM-01).
- **Utilisateur** — belongs to an Etude, one or more roles (RBAC, EF-ROL-01/06).
- **Dossier** — central entity (BRD §4.1). Aggregates comparants, immeubles, actes, courriers, formalités, documents, emails, evenements, simulations, historique. Carries its own branche de droit + type d'acte classification (EF-DOS-02/03).
- **Personne** — physical or legal person, or third party/partner. Linked to dossiers via **Comparant** (join entity carrying "qualité": vendeur, acquéreur, etc.; self-referencing for family links).
- **Immeuble** — property record (régime du bien, cadastral refs), can attach to multiple dossiers.
- **Trame** — shared national template, not tenant-scoped (lives outside any étude); generates Actes; customizable per étude (EF-ADM-05).
- **Acte** — generated from a Trame, tied to a Dossier.
- **Courrier**, **Formalité**, **Document (GED)**, **Email**, **Evenement**, **Simulation** — all tenant-scoped, attached to a Dossier (and optionally an Acte).
- **Historique** — audit log (who/what/when), references Utilisateur and optionally Dossier (ENF-06, EF-ACC-02).
- **Barème** national — versioned reference table, not tenant-scoped, not FK-linked to dossiers/actes; queried by simulators/fee calculator.

Open question Q-TRA-01 (unresolved as of ADR v0.1): can a Dossier generate Actes from a branche de droit different from its own (e.g. a succession dossier producing a real-estate attestation)? The current model permits this since Trame carries its own branche independent of the Dossier's. Treat this as still open — don't "fix" it without checking with the user first, since the BRD explicitly defers it to business sign-off.

RBAC is not modeled as domain entities — implement it via Supabase Auth + RLS policies keyed on role claims, not a Django-style permissions table.

## Signature integration (ADR-02, unaffected by the Supabase switch)

- All signature flows (EF-SIG-01–06) go through a `SignatureProvider` interface: designate signers, request a signature, get status, retrieve the signed act + archival receipt.
- Until ADSN/MICEN specs (EI-12) are received, use a mock `SignatureProvider` implementation. Do not build speculative "real" ADSN integration code — the actual transport mechanism (REST API, file exchange over VPN, proprietary SOAP/XML) is unknown until ADSN provides specs.
- Keep this isolated: a second `SignatureProvider` implementation (e.g. YouSign-style remote signature, EF-SIG-07) should plug in without touching the rest of the app.

## Phasing (BRD §10) — what's in scope now

- **MVP**: dossiers, personnes, immeubles, comparants, recherche, agenda (Outlook sync), courriers, formalités (manual status tracking, no direct integration yet), full trame engine + a 2-type library (succession, donation) in Droit de la famille, acte generation, signature/AAE (mock SignatureProvider), GED/scan, email attachment, access control/historique, étude admin/setup, centrally-maintained trame library + barème (manually distributed to 1–2 étude tenants).
- **MVP+1**: remaining 7 Droit de la famille acte types, business simulators (succession, donation-partage), barème-based fee calculator, reporting/dashboards, direct formality integrations (EI-03/04/05), versioned trame/barème distribution (EF-PLT-01/02).
- **Later / out of scope for now**: other branches de droit (immobilier, entreprise et sociétés), full-text document search, cadastral auto-fill, remote signature, banking integration, third-party accounting integration, mobile app, multi-tenant subscription provisioning automation.

When implementing a feature, check its phase tag before building beyond what's needed — don't pull MVP+1/Ultérieur scope into MVP work unless asked.

## Things explicitly out of scope

- Notarial accounting (CRPCEN) — handled by third-party integration, never build this in-house.
- Full study financial/billing module.
- "Bible particulière" content.

## Open questions to flag, not silently resolve

If work touches any of these, surface the ambiguity to the user rather than guessing:
- Q-TRA-01 (dossier vs. acte branche de droit independence — see Domain model above).
- Q-ARCH-02 / EI-12 — exact ADSN/MICEN integration mechanism, pending non-public specs.
- Anything tagged "À Confirmer" in the BRD (e.g. EF-PER-06/07 external-user access model, EF-COM-* internal messaging, ENF-10 UI personalization) — these are unvalidated business scope, not just technical decisions.
