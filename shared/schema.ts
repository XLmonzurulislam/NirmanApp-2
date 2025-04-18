import { pgTable, text, serial, integer, date, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Construction Sites
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  expectedEndDate: date("expected_end_date"),
  status: text("status").notNull().default("ongoing"),
});

export const insertSiteSchema = createInsertSchema(sites).omit({ id: true });
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sites.$inferSelect;

// Materials
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  quantity: real("quantity").notNull().default(0),
  minStockLevel: real("min_stock_level").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, lastUpdated: true });
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

// Material Transactions
export const materialTransactions = pgTable("material_transactions", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull(),
  siteId: integer("site_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  transactionType: text("transaction_type").notNull(), // 'added' or 'used'
  quantity: real("quantity").notNull(),
  notes: text("notes"),
  recordedBy: text("recorded_by").notNull(),
});

export const insertMaterialTransactionSchema = createInsertSchema(materialTransactions).omit({ id: true });
export type InsertMaterialTransaction = z.infer<typeof insertMaterialTransactionSchema>;
export type MaterialTransaction = typeof materialTransactions.$inferSelect;

// Workers
export const workers = pgTable("workers", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  dailyWage: real("daily_wage").notNull(),
  phone: text("phone"),
  joinDate: date("join_date").notNull().defaultNow(),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({ id: true });
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workers.$inferSelect;

// Attendance
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(),
  siteId: integer("site_id").notNull(),
  date: date("date").notNull(),
  present: boolean("present").notNull().default(true),
  hoursWorked: real("hours_worked"),
  notes: text("notes"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  date: date("date").notNull().defaultNow(),
  description: text("description"),
  hasReceipt: boolean("has_receipt").default(false),
  receiptUrl: text("receipt_url"),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Photos
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;

// Notes
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  category: text("category"),
});

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// User (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
