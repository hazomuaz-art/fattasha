// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const searches = sqliteTable("searches", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  sha256: text("sha256").notNull(),
  width: integer("width"),
  height: integer("height"),
  objectKey: text("object_key").notNull(),
  publicToken: text("public_token").unique(),
  publicExpiresAt: integer("public_expires_at", { mode: "timestamp" }),
  status: text("status").notNull().default("completed"),
  searchedSources: integer("searched_sources").notNull().default(0),
  availableSources: integer("available_sources").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [index("idx_searches_user_created").on(table.userId, table.createdAt)]);

export const sourceRuns = sqliteTable("source_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  searchId: text("search_id").notNull().references(() => searches.id, { onDelete: "cascade" }),
  connector: text("connector").notNull(),
  status: text("status").notNull(),
  resultUrl: text("result_url"),
  detail: text("detail"),
  durationMs: integer("duration_ms").notNull(),
  matchCount: integer("match_count").notNull().default(0),
}, (table) => [index("idx_source_runs_search").on(table.searchId)]);

export const matches = sqliteTable("matches", {
  id: text("id").primaryKey(), searchId: text("search_id").notNull().references(() => searches.id, { onDelete: "cascade" }),
  connector: text("connector").notNull(), platform: text("platform").notNull(), title: text("title").notNull(),
  pageUrl: text("page_url").notNull(), similarity: real("similarity").notNull(), matchType: text("match_type").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [index("idx_matches_search").on(table.searchId)]);

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  searchId: text("search_id").references(() => searches.id, { onDelete: "set null" }),
  sourceUrl: text("source_url").notNull(),
  reportType: text("report_type").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [index("idx_reports_user_created").on(table.userId, table.createdAt)]);

export const facebookUsers = sqliteTable("facebook_users", {
  facebookId: text("facebook_id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }).notNull(),
}, (table) => [index("idx_facebook_users_user").on(table.userId)]);
