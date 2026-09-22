-- ============================================================
-- SmartDesk IT Service — PostgreSQL schema
-- Generated to match the conventions of ERD_V1_4_3.sql
-- (quoted snake_case identifiers, IDENTITY primary keys,
--  enum types, foreign keys added via ALTER TABLE at the end).
-- Seed data below mirrors src/lib/data.js from the SmartDesk_IT_Service app.
-- ============================================================


-- Enumerated types


CREATE TYPE "user_role_enum" AS ENUM ('employee', 'agent', 'admin');

CREATE TYPE "ticket_status_enum" AS ENUM ('new', 'in_progress', 'pending', 'resolved', 'closed');

CREATE TYPE "ticket_priority_enum" AS ENUM ('critical', 'high', 'medium', 'low');


-- Categories of IT issue (network, accounts, devices, email, software, storage)

CREATE TABLE IF NOT EXISTS "categories" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"name" VARCHAR(100) UNIQUE NOT NULL,
	"bg_color" VARCHAR(20),
	"accent_color" VARCHAR(20),
	PRIMARY KEY("id")
);


-- Employees, IT support agents and admins.
-- "username" is what is typed into the login form; "email" only exists
-- to deliver the forgot-password link, and is never used to log in.
-- failed_login_attempts / locked_until back the account-lockout policy
-- the KB itself documents (article: "บัญชีถูกล็อกหลังใส่รหัสผ่านผิดหลายครั้ง").

CREATE TABLE IF NOT EXISTS "users" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"employee_code" VARCHAR(20) UNIQUE NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"username" VARCHAR(50) UNIQUE NOT NULL,
	"email" VARCHAR(255) UNIQUE NOT NULL,
	"pwd_hash" VARCHAR(255) NOT NULL,
	"role" user_role_enum NOT NULL,
	"title" VARCHAR(255),
	"failed_login_attempts" SMALLINT NOT NULL DEFAULT 0,
	"locked_until" TIMESTAMPTZ,
	"last_login_at" TIMESTAMPTZ,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


-- One-time tokens for the "forgot your password?" flow. Only the hash of
-- the token is stored (like a password) so a DB leak alone cannot be used
-- to reset an account; the raw token only ever exists in the emailed link.
-- A token is single-use ("used_at") and short-lived ("expires_at").

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"user_id" INTEGER NOT NULL,
	"token_hash" VARCHAR(255) UNIQUE NOT NULL,
	"requested_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	"expires_at" TIMESTAMPTZ NOT NULL,
	"used_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);


-- Impact / urgency lookup values used on the ticket form

CREATE TABLE IF NOT EXISTS "impact_levels" (
	"id" SMALLINT NOT NULL,
	"label" VARCHAR(100) NOT NULL,
	PRIMARY KEY("id")
);


CREATE TABLE IF NOT EXISTS "urgency_levels" (
	"id" SMALLINT NOT NULL,
	"label" VARCHAR(100) NOT NULL,
	PRIMARY KEY("id")
);


-- impact x urgency -> priority lookup (the triage matrix)

CREATE TABLE IF NOT EXISTS "priority_matrix" (
	"impact_id" SMALLINT NOT NULL,
	"urgency_id" SMALLINT NOT NULL,
	"priority" ticket_priority_enum NOT NULL,
	PRIMARY KEY("impact_id", "urgency_id")
);


-- SLA resolution target, in hours, per priority

CREATE TABLE IF NOT EXISTS "sla_policies" (
	"priority" ticket_priority_enum NOT NULL,
	"resolve_within_hours" NUMERIC(6,2) NOT NULL,
	PRIMARY KEY("priority")
);


-- Knowledge-base articles

CREATE TABLE IF NOT EXISTS "kb_articles" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"category_id" INTEGER NOT NULL,
	"title" VARCHAR(255) NOT NULL,
	"summary" VARCHAR(255),
	"views" INTEGER NOT NULL DEFAULT 0,
	"source_ticket_id" INTEGER UNIQUE,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


-- Ordered how-to steps for an article

CREATE TABLE IF NOT EXISTS "kb_steps" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"kb_id" INTEGER NOT NULL,
	"step_no" SMALLINT NOT NULL,
	"content" TEXT NOT NULL,
	PRIMARY KEY("id"),
	UNIQUE("kb_id", "step_no")
);


-- Free-text search tags, shared across articles

CREATE TABLE IF NOT EXISTS "tags" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"tag" VARCHAR(100) UNIQUE NOT NULL,
	PRIMARY KEY("id")
);


CREATE TABLE IF NOT EXISTS "kb_article_tags" (
	"kb_id" INTEGER NOT NULL,
	"tag_id" INTEGER NOT NULL,
	PRIMARY KEY("kb_id", "tag_id")
);


-- Discussion thread under an article. author_id is NULL when the commenter
-- is not a registered account (the demo data has community contributors
-- who never logged in), so author_name always carries the display name.

CREATE TABLE IF NOT EXISTS "kb_comments" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"kb_id" INTEGER NOT NULL,
	"author_id" INTEGER,
	"author_name" VARCHAR(255) NOT NULL,
	"comment" TEXT NOT NULL,
	"votes" INTEGER NOT NULL DEFAULT 0,
	"is_accepted" BOOLEAN NOT NULL DEFAULT FALSE,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


-- One helpful/not-helpful vote per user per article

CREATE TABLE IF NOT EXISTS "kb_feedback" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"kb_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"is_helpful" BOOLEAN NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY("id"),
	UNIQUE("kb_id", "user_id")
);


-- Self-service "deflection" log: one row each time an article resolved
-- an issue before the person had to open a ticket

CREATE TABLE IF NOT EXISTS "kb_deflections" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"kb_id" INTEGER,
	"user_id" INTEGER,
	"occurred_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


-- Support tickets

CREATE TABLE IF NOT EXISTS "tickets" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"ticket_no" VARCHAR(20) UNIQUE NOT NULL,
	"title" VARCHAR(255) NOT NULL,
	"description" TEXT NOT NULL,
	"impact_id" SMALLINT NOT NULL,
	"urgency_id" SMALLINT NOT NULL,
	"priority" ticket_priority_enum NOT NULL,
	"status" ticket_status_enum NOT NULL DEFAULT 'new',
	"category_id" INTEGER NOT NULL,
	"reporter_id" INTEGER NOT NULL,
	"assignee_id" INTEGER,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	"resolution_summary" TEXT,
	"resolved_at" TIMESTAMPTZ,
	"csat_score" SMALLINT CHECK ("csat_score" BETWEEN 1 AND 5),
	"confirmed_by_reporter" BOOLEAN NOT NULL DEFAULT FALSE,
	"reopened_count" SMALLINT NOT NULL DEFAULT 0,
	"ai_suggested_kb_id" INTEGER,
	"ai_confidence" SMALLINT,
	PRIMARY KEY("id")
);


-- Reporter <-> agent conversation on a ticket ("is_staff" marks IT replies)

CREATE TABLE IF NOT EXISTS "ticket_messages" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"ticket_id" INTEGER NOT NULL,
	"sender_id" INTEGER NOT NULL,
	"is_staff" BOOLEAN NOT NULL,
	"message" TEXT NOT NULL,
	"sent_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


-- Notes visible to IT staff only, never shown to the reporter

CREATE TABLE IF NOT EXISTS "ticket_internal_notes" (
	"id" INTEGER GENERATED ALWAYS AS IDENTITY,
	"ticket_id" INTEGER NOT NULL,
	"author_id" INTEGER NOT NULL,
	"note" TEXT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY("id")
);


-- ============================================================
-- Foreign keys (added after every table exists, same pattern as
-- ERD_V1_4_3.sql, since a few references point forward: tickets
-- <-> kb_articles reference each other in both directions).
-- ============================================================


ALTER TABLE "password_reset_tokens"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_articles"
ADD FOREIGN KEY("category_id") REFERENCES "categories"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_articles"
ADD FOREIGN KEY("source_ticket_id") REFERENCES "tickets"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_steps"
ADD FOREIGN KEY("kb_id") REFERENCES "kb_articles"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_article_tags"
ADD FOREIGN KEY("kb_id") REFERENCES "kb_articles"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_article_tags"
ADD FOREIGN KEY("tag_id") REFERENCES "tags"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_comments"
ADD FOREIGN KEY("kb_id") REFERENCES "kb_articles"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_comments"
ADD FOREIGN KEY("author_id") REFERENCES "users"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_feedback"
ADD FOREIGN KEY("kb_id") REFERENCES "kb_articles"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_feedback"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_deflections"
ADD FOREIGN KEY("kb_id") REFERENCES "kb_articles"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "kb_deflections"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "priority_matrix"
ADD FOREIGN KEY("impact_id") REFERENCES "impact_levels"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "priority_matrix"
ADD FOREIGN KEY("urgency_id") REFERENCES "urgency_levels"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tickets"
ADD FOREIGN KEY("impact_id") REFERENCES "impact_levels"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tickets"
ADD FOREIGN KEY("urgency_id") REFERENCES "urgency_levels"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tickets"
ADD FOREIGN KEY("category_id") REFERENCES "categories"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tickets"
ADD FOREIGN KEY("reporter_id") REFERENCES "users"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tickets"
ADD FOREIGN KEY("assignee_id") REFERENCES "users"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tickets"
ADD FOREIGN KEY("ai_suggested_kb_id") REFERENCES "kb_articles"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ticket_messages"
ADD FOREIGN KEY("ticket_id") REFERENCES "tickets"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ticket_messages"
ADD FOREIGN KEY("sender_id") REFERENCES "users"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ticket_internal_notes"
ADD FOREIGN KEY("ticket_id") REFERENCES "tickets"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ticket_internal_notes"
ADD FOREIGN KEY("author_id") REFERENCES "users"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;