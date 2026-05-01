import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "blog_page_content" (
      "id" serial PRIMARY KEY NOT NULL,
      "eyebrow" varchar DEFAULT 'WHILE YOU WAIT',
      "title" varchar DEFAULT 'Blog',
      "summary" varchar DEFAULT 'Stuff to read (or write) while we''re baking. We are limit testing this page — it''s a sketch of something bigger. Someday: every purchase = one ticket to publish your own post here. Someday after that: a physical room with drinks, food, and people swapping ideas. For now, just a few notes and the start of a place.',
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE "discussion_board_content" (
      "id" serial PRIMARY KEY NOT NULL,
      "eyebrow" varchar DEFAULT 'THINK OUT LOUD',
      "title" varchar DEFAULT 'Discussion Board',
      "summary" varchar DEFAULT 'A small space for questions, claims, and replies — meant for the in-between moment while your order''s being made. We are limit testing this page. Eventually it''s where the conversation continues offline too: at our future physical place, over good drinks and good food, talking through ideas together.',
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    ALTER TABLE "blog_page_content" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "discussion_board_content" DISABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "blog_page_content" CASCADE;
    DROP TABLE "discussion_board_content" CASCADE;
  `)
}
