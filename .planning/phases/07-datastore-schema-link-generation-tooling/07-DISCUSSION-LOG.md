# Phase 7: Datastore Schema & Link-Generation Tooling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 07-datastore-schema-link-generation-tooling
**Areas discussed:** Guest CSV input shape, Re-run behavior (+ a reconciliation pass on email storage & delete model)

---

## Gray-area selection

| Area offered | Description | Selected |
|--------------|-------------|----------|
| Guest CSV input shape | What columns guests.csv has | ✓ |
| Re-run behavior | Idempotency / stable key on re-run | ✓ |
| Link base URL in output | URL prefix before deploy | (deferred to Claude's discretion) |
| Neon provisioning + git-safety | DB provisioning, DATABASE_URL, links.csv gitignore, sample CSV | (deferred to Claude's discretion) |

---

## Guest CSV input shape

### Q1: What columns will guests.csv have?
| Option | Description | Selected |
|--------|-------------|----------|
| name only | Single display_name column | |
| name + email | display_name + email; email carried to links.csv, not in Neon/token | ✓ |
| name + email + party | + party/household label or size | |

**User's choice:** name + email
**Notes:** During reconciliation, email storage was upgraded — it IS stored in Neon (unique column) as the upsert key. See reconciliation below.

### Q2: How should a row with blank display_name be handled?
| Option | Description | Selected |
|--------|-------------|----------|
| Skip + warn | Skip row, warn with line number, continue | ✓ |
| Fail fast | Abort whole run on first bad row | |

**User's choice:** Skip + warn

---

## Re-run behavior

### Q1: How does a re-run decide new vs existing guest (stable key)?
| Option | Description | Selected |
|--------|-------------|----------|
| email as the key | Existing email keeps id, updates name; new email mints id | ✓ |
| Persisted links.csv | Re-read prior links.csv for id↔email map | |
| No keying — manual | Always mint fresh; user manages adds manually | |

**User's choice:** email as the key

### Q2: What happens to a guest in DB but no longer in CSV?
| Option | Description | Selected |
|--------|-------------|----------|
| Leave in DB | Additive/updating only; deletions manual | |
| Report only | Leave + print "in DB, not in CSV" list | |
| Delete from DB | Remove rows not in CSV (DB mirrors CSV) | ✓ (initial — later revised to soft-delete) |

**User's choice:** Delete from DB → **revised to soft-delete** in reconciliation.

---

## Reconciliation pass (conflict surfaced)

Conflict: "email as key" + "delete-from-DB" both require a durable `email → id` mapping, but the
CSV-area answer had email living only in links.csv, not Neon. Also hard delete breaks
already-distributed links (conflicts with the durability goal). Two focused questions resolved it.

### Q1: Where should the email→id mapping live?
| Option | Description | Selected |
|--------|-------------|----------|
| Store email in Neon | Nullable UNIQUE email column; DB is source of truth | ✓ |
| Keep email out of Neon | Recover map from prior links.csv each run | |

**User's choice:** Store email in Neon (revises earlier "email not stored in Neon").

### Q2: Confirm the delete model
| Option | Description | Selected |
|--------|-------------|----------|
| Confirm hard delete | DB mirrors CSV exactly; removing a row deletes the record | |
| Soft-delete instead | Mark removed rows inactive (deleted_at/is_active); id + link survive | ✓ |
| Report-only after all | Leave untouched, print list, delete manually | |

**User's choice:** Soft-delete instead.

---

## Claude's Discretion (deferred areas — defaults recorded in CONTEXT.md)

- Link base URL: configurable `SITE_BASE_URL` env var; clearly-marked placeholder host if unset; path `/i/<id>?t=<token>`.
- Neon provisioning: user provisions + supplies `DATABASE_URL` in `.env.local`; idempotent migration via `@neondatabase/serverless`.
- Git-safety: `.gitignore` covers `guests.csv`, `links.csv`, `.env*`; commit fake-data `guests.example.csv`.
- ID/email normalization: nanoid ~21 chars; trim+lowercase email for keying.

## Deferred Ideas

- Party/household column + size (RSVP headcount) — premature; revisit at RSVP milestone.
- Hard delete — rejected in favor of soft-delete to keep distributed links durable.
