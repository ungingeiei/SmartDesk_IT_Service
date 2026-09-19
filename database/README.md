# Database

PostgreSQL schema for SmartDesk IT Service, generated to match the
conventions of the team's `ERD_V1_4_3.sql` reference file (quoted
snake_case identifiers, `GENERATED ALWAYS AS IDENTITY` primary keys,
enum types, foreign keys added via `ALTER TABLE` after every table
exists).

Run the files in order:

1. **`01_schema.sql`** — table definitions, enum types, foreign keys.
   Run once against every environment.
2. **`02_reference_data.sql`** — lookup data the app logic depends on
   (issue categories, impact/urgency levels, the priority matrix,
   SLA targets). Run this in every environment too, production
   included — nothing in it is demo content.
3. **`03_test_data.sql`** — demo users, KB articles, and tickets
   ported from `src/lib/data.js` (the mock data the frontend used
   before this schema existed). **Dev/QA only — do not run against
   production.** Login credentials in here are placeholders
   (`pwd_hash` is literally `REPLACE_WITH_REAL_BCRYPT_HASH`), so
   nobody can actually sign in with these rows until the app
   generates real password hashes for them.

```bash
psql "$DATABASE_URL" -f database/01_schema.sql
psql "$DATABASE_URL" -f database/02_reference_data.sql
psql "$DATABASE_URL" -f database/03_test_data.sql   # dev/QA only
```
