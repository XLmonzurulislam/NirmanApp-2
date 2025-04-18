import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertSiteSchema, 
  insertMaterialSchema, 
  insertMaterialTransactionSchema,
  insertWorkerSchema,
  insertAttendanceSchema,
  insertExpenseSchema,
  insertPhotoSchema,
  insertNoteSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - prefix all with /api
  
  // Sites API
  app.get("/api/sites", async (req: Request, res: Response) => {
    try {
      const sites = await storage.getSites();
      res.json(sites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sites" });
    }
  });

  app.get("/api/sites/:id", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.id);
      const site = await storage.getSite(siteId);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch site" });
    }
  });

  app.post("/api/sites", async (req: Request, res: Response) => {
    try {
      const parseResult = insertSiteSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid site data", errors: parseResult.error.errors });
      }
      
      const site = await storage.createSite(parseResult.data);
      res.status(201).json(site);
    } catch (error) {
      res.status(500).json({ message: "Failed to create site" });
    }
  });

  app.put("/api/sites/:id", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.id);
      const parseResult = insertSiteSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid site data", errors: parseResult.error.errors });
      }
      
      const updatedSite = await storage.updateSite(siteId, parseResult.data);
      if (!updatedSite) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      res.json(updatedSite);
    } catch (error) {
      res.status(500).json({ message: "Failed to update site" });
    }
  });

  app.delete("/api/sites/:id", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.id);
      const deleted = await storage.deleteSite(siteId);
      if (!deleted) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete site" });
    }
  });

  // Materials API
  app.get("/api/sites/:siteId/materials", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.siteId);
      const materials = await storage.getMaterials(siteId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.get("/api/sites/:siteId/materials/low-stock", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.siteId);
      const materials = await storage.getLowStockMaterials(siteId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock materials" });
    }
  });

  app.get("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const materialId = parseInt(req.params.id);
      const material = await storage.getMaterial(materialId);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });

  app.post("/api/materials", async (req: Request, res: Response) => {
    try {
      const parseResult = insertMaterialSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid material data", errors: parseResult.error.errors });
      }
      
      const material = await storage.createMaterial(parseResult.data);
      res.status(201).json(material);
    } catch (error) {
      res.status(500).json({ message: "Failed to create material" });
    }
  });

  app.put("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const materialId = parseInt(req.params.id);
      const parseResult = insertMaterialSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid material data", errors: parseResult.error.errors });
      }
      
      const updatedMaterial = await storage.updateMaterial(materialId, parseResult.data);
      if (!updatedMaterial) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      res.json(updatedMaterial);
    } catch (error) {
      res.status(500).json({ message: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const materialId = parseInt(req.params.id);
      const deleted = await storage.deleteMaterial(materialId);
      if (!deleted) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  // Material Transactions API
  app.get("/api/sites/:siteId/material-transactions", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.siteId);
      const transactions = await storage.getMaterialTransactions(siteId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch material transactions" });
    }
  });

  app.get("/api/materials/:materialId/transactions", async (req: Request, res: Response) => {
    try {
      const materialId = parseInt(req.params.materialId);
      const transactions = await storage.getMaterialTransactionsByMaterial(materialId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch material transactions" });
    }
  });

  app.post("/api/material-transactions", async (req: Request, res: Response) => {
    try {
      const parseResult = insertMaterialTransactionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid transaction data", errors: parseResult.error.errors });
      }
      
      const transaction = await storage.createMaterialTransaction(parseResult.data);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create material transaction" });
    }
  });

  // Workers API
  app.get("/api/sites/:siteId/workers", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.siteId);
      const workers = await storage.getWorkers(siteId);
      res.json(workers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workers" });
    }
  });

  app.get("/api/workers/:id", async (req: Request, res: Response) => {
    try {
      const workerId = parseInt(req.params.id);
      const worker = await storage.getWorker(workerId);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      res.json(worker);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch worker" });
    }
  });

  app.post("/api/workers", async (req: Request, res: Response) => {
    try {
      const parseResult = insertWorkerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid worker data", errors: parseResult.error.errors });
      }
      
      const worker = await storage.createWorker(parseResult.data);
      res.status(201).json(worker);
    } catch (error) {
      res.status(500).json({ message: "Failed to create worker" });
    }
  });

  app.put("/api/workers/:id", async (req: Request, res: Response) => {
    try {
      const workerId = parseInt(req.params.id);
      const parseResult = insertWorkerSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid worker data", errors: parseResult.error.errors });
      }
      
      const updatedWorker = await storage.updateWorker(workerId, parseResult.data);
      if (!updatedWorker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      
      res.json(updatedWorker);
    } catch (error) {
      res.status(500).json({ message: "Failed to update worker" });
    }
  });

  app.delete("/api/workers/:id", async (req: Request, res: Response) => {
    try {
      const workerId = parseInt(req.params.id);
      const deleted = await storage.deleteWorker(workerId);
      if (!deleted) {
        return res.status(404).json({ message: "Worker not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete worker" });
    }
  });

  // Attendance API
  app.get("/api/sites/:siteId/attendance", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.siteId);
      const dateParam = req.query.date as string;
      let date: Date;
      
      if (dateParam) {
        date = new Date(dateParam);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      } else {
        date = new Date(); // Default to today
      }
      
      const attendance = await storage.getAttendance(siteId, date);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/workers/:workerId/attendance", async (req: Request, res: Response) => {
    try {
      const workerId = parseInt(req.params.workerId);
      const attendance = await storage.getAttendanceByWorker(workerId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch worker attendance" });
    }
  });

  app.post("/api/attendance", async (req: Request, res: Response) => {
    try {
      const parseResult = insertAttendanceSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid attendance data", errors: parseResult.error.errors });
      }
      
      const attendance = await storage.createAttendance(parseResult.data);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to create attendance record" });
    }
  });

  app.put("/api/attendance/:id", async (req: Request, res: Response) => {
    try {
      const attendanceId = parseInt(req.params.id);
      const parseResult = insertAttendanceSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid attendance data", errors: parseResult.error.errors });
      }
      
      const updatedAttendance = await storage.updateAttendance(attendanceId, parseResult.data);
      if (!updatedAttendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(updatedAttendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendance record" });
    }
  });

  // Expenses API
  app.get("/api/sites/:siteId/expenses", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.siteId);
      const expenses = await storage.getExpenses(siteId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const expenseId = parseInt(req.params.id);
      const expense = await storage.getExpense(expenseId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const parseResult = insertExpenseSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid expense data", errors: parseResult.error.errors });
      }
      
      const expense = await storage.createExpense(parseResult.data);
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const expenseId = parseInt(req.params.id);
      const parseResult = insertExpenseSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid expense data", errors: parseResult.error.errors });
      }
      
      const updatedExpense = await storage.updateExpense(expenseId, parseResult.data);
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(updatedExpense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const expenseId = parseInt(req.params.id);
      const deleted = await storage.deleteExpense(expenseId);
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Photos API
  app.get("/api/sites/:siteId/photos", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.siteId);
      const photos = await storage.getPhotos(siteId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  app.post("/api/photos", async (req: Request, res: Response) => {
    try {
      const parseResult = insertPhotoSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid photo data", errors: parseResult.error.errors });
      }
      
      const photo = await storage.createPhoto(parseResult.data);
      res.status(201).json(photo);
    } catch (error) {
      res.status(500).json({ message: "Failed to create photo" });
    }
  });

  app.delete("/api/photos/:id", async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id);
      const deleted = await storage.deletePhoto(photoId);
      if (!deleted) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Notes API
  app.get("/api/sites/:siteId/notes", async (req: Request, res: Response) => {
    try {
      const siteId = parseInt(req.params.siteId);
      const notes = await storage.getNotes(siteId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const noteId = parseInt(req.params.id);
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", async (req: Request, res: Response) => {
    try {
      const parseResult = insertNoteSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid note data", errors: parseResult.error.errors });
      }
      
      const note = await storage.createNote(parseResult.data);
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.put("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const noteId = parseInt(req.params.id);
      const parseResult = insertNoteSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid note data", errors: parseResult.error.errors });
      }
      
      const updatedNote = await storage.updateNote(noteId, parseResult.data);
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(updatedNote);
    } catch (error) {
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const noteId = parseInt(req.params.id);
      const deleted = await storage.deleteNote(noteId);
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
