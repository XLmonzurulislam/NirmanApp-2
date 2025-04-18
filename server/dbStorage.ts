import { db } from "./db";
import { eq, and, lt, desc } from "drizzle-orm";
import { 
  sites, type Site, type InsertSite,
  materials, type Material, type InsertMaterial,
  materialTransactions, type MaterialTransaction, type InsertMaterialTransaction,
  workers, type Worker, type InsertWorker,
  attendance, type Attendance, type InsertAttendance,
  expenses, type Expense, type InsertExpense,
  photos, type Photo, type InsertPhoto,
  notes, type Note, type InsertNote,
  users, type User, type InsertUser
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Site operations
  async getSites(): Promise<Site[]> {
    return await db.select().from(sites);
  }

  async getSite(id: number): Promise<Site | undefined> {
    const result = await db.select().from(sites).where(eq(sites.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createSite(site: InsertSite): Promise<Site> {
    const [newSite] = await db.insert(sites).values(site).returning();
    return newSite;
  }

  async updateSite(id: number, site: Partial<InsertSite>): Promise<Site | undefined> {
    const [updatedSite] = await db
      .update(sites)
      .set(site)
      .where(eq(sites.id, id))
      .returning();
    return updatedSite;
  }

  async deleteSite(id: number): Promise<boolean> {
    const result = await db.delete(sites).where(eq(sites.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Material operations
  async getMaterials(siteId: number): Promise<Material[]> {
    return await db
      .select()
      .from(materials)
      .where(eq(materials.siteId, siteId));
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const result = await db
      .select()
      .from(materials)
      .where(eq(materials.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const materialWithDate = {
      ...material,
      lastUpdated: new Date()
    };
    const [newMaterial] = await db
      .insert(materials)
      .values(materialWithDate)
      .returning();
    return newMaterial;
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    const materialWithDate = {
      ...material,
      lastUpdated: new Date()
    };
    const [updatedMaterial] = await db
      .update(materials)
      .set(materialWithDate)
      .where(eq(materials.id, id))
      .returning();
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const result = await db
      .delete(materials)
      .where(eq(materials.id, id));
    return result.rowCount > 0;
  }

  async getLowStockMaterials(siteId: number): Promise<Material[]> {
    return await db
      .select()
      .from(materials)
      .where(
        and(
          eq(materials.siteId, siteId),
          lt(materials.quantity, materials.minStockLevel)
        )
      );
  }

  // Material Transaction operations
  async getMaterialTransactions(siteId: number): Promise<MaterialTransaction[]> {
    return await db
      .select()
      .from(materialTransactions)
      .where(eq(materialTransactions.siteId, siteId))
      .orderBy(desc(materialTransactions.date));
  }

  async getMaterialTransactionsByMaterial(materialId: number): Promise<MaterialTransaction[]> {
    return await db
      .select()
      .from(materialTransactions)
      .where(eq(materialTransactions.materialId, materialId))
      .orderBy(desc(materialTransactions.date));
  }

  async createMaterialTransaction(transaction: InsertMaterialTransaction): Promise<MaterialTransaction> {
    const [newTransaction] = await db
      .insert(materialTransactions)
      .values(transaction)
      .returning();
    
    // Update the material quantity
    const material = await this.getMaterial(transaction.materialId);
    if (material) {
      let newQuantity = material.quantity;
      if (transaction.transactionType === "added") {
        newQuantity += transaction.quantity;
      } else if (transaction.transactionType === "used") {
        newQuantity -= transaction.quantity;
        if (newQuantity < 0) newQuantity = 0;
      }
      
      await this.updateMaterial(material.id, { quantity: newQuantity });
    }
    
    return newTransaction;
  }

  // Worker operations
  async getWorkers(siteId: number): Promise<Worker[]> {
    return await db
      .select()
      .from(workers)
      .where(eq(workers.siteId, siteId));
  }

  async getWorker(id: number): Promise<Worker | undefined> {
    const result = await db
      .select()
      .from(workers)
      .where(eq(workers.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createWorker(worker: InsertWorker): Promise<Worker> {
    const [newWorker] = await db
      .insert(workers)
      .values(worker)
      .returning();
    return newWorker;
  }

  async updateWorker(id: number, worker: Partial<InsertWorker>): Promise<Worker | undefined> {
    const [updatedWorker] = await db
      .update(workers)
      .set(worker)
      .where(eq(workers.id, id))
      .returning();
    return updatedWorker;
  }

  async deleteWorker(id: number): Promise<boolean> {
    const result = await db
      .delete(workers)
      .where(eq(workers.id, id));
    return result.rowCount > 0;
  }

  // Attendance operations
  async getAttendance(siteId: number, date: Date): Promise<Attendance[]> {
    const dateString = date.toISOString().split('T')[0];
    const result = await db
      .select()
      .from(attendance)
      .where(eq(attendance.siteId, siteId));
    
    // Filter by date client-side since date comparisons can be tricky
    return result.filter(a => {
      const attendanceDateStr = a.date.toISOString().split('T')[0];
      return attendanceDateStr === dateString;
    });
  }

  async getAttendanceByWorker(workerId: number): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.workerId, workerId))
      .orderBy(desc(attendance.date));
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db
      .insert(attendance)
      .values(attendance)
      .returning();
    return newAttendance;
  }

  async updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [updatedAttendance] = await db
      .update(attendance)
      .set(attendance)
      .where(eq(attendance.id, id))
      .returning();
    return updatedAttendance;
  }
  
  // Expense operations
  async getExpenses(siteId: number): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.siteId, siteId))
      .orderBy(desc(expenses.date));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const result = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values(expense)
      .returning();
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updatedExpense] = await db
      .update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(eq(expenses.id, id));
    return result.rowCount > 0;
  }

  // Photo operations
  async getPhotos(siteId: number): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .where(eq(photos.siteId, siteId))
      .orderBy(desc(photos.date));
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const photoWithDate = {
      ...photo,
      date: new Date()
    };
    const [newPhoto] = await db
      .insert(photos)
      .values(photoWithDate)
      .returning();
    return newPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    const result = await db
      .delete(photos)
      .where(eq(photos.id, id));
    return result.rowCount > 0;
  }

  // Note operations
  async getNotes(siteId: number): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.siteId, siteId))
      .orderBy(desc(notes.date));
  }

  async getNote(id: number): Promise<Note | undefined> {
    const result = await db
      .select()
      .from(notes)
      .where(eq(notes.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const noteWithDate = {
      ...note,
      date: new Date()
    };
    const [newNote] = await db
      .insert(notes)
      .values(noteWithDate)
      .returning();
    return newNote;
  }

  async updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined> {
    const updatedNote = {
      ...note,
      date: new Date()
    };
    const [result] = await db
      .update(notes)
      .set(updatedNote)
      .where(eq(notes.id, id))
      .returning();
    return result;
  }

  async deleteNote(id: number): Promise<boolean> {
    const result = await db
      .delete(notes)
      .where(eq(notes.id, id));
    return result.rowCount > 0;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  // Seed initial data
  async seedData() {
    // Create a sample site if none exists
    const existingSites = await this.getSites();
    if (existingSites.length === 0) {
      // Create a sample site
      const dhakaSite: InsertSite = {
        name: "Dhaka Residence",
        location: "Gulshan, Dhaka",
        description: "A residential building project in Gulshan",
        startDate: new Date("2023-09-01"),
        expectedEndDate: new Date("2024-06-30"),
        status: "ongoing"
      };
      
      const site = await this.createSite(dhakaSite);
      
      // Add some materials to the site
      const materials = [
        {
          siteId: site.id,
          name: "Cement (OPC)",
          category: "Cement",
          unit: "Bags",
          quantity: 15,
          minStockLevel: 50
        },
        {
          siteId: site.id,
          name: "Sand (Coarse)",
          category: "Sand",
          unit: "CFT",
          quantity: 120,
          minStockLevel: 200
        },
        {
          siteId: site.id,
          name: "Steel Rods (10mm)",
          category: "Steel",
          unit: "Kg",
          quantity: 850,
          minStockLevel: 500
        }
      ];
      
      for (const material of materials) {
        await this.createMaterial(material);
      }
      
      // Add some workers
      const workers = [
        {
          siteId: site.id,
          name: "Abdul Karim",
          role: "Mason",
          dailyWage: 800,
          phone: "01711223344",
          joinDate: new Date("2023-09-01")
        },
        {
          siteId: site.id,
          name: "Mohammad Ali",
          role: "Helper",
          dailyWage: 500,
          phone: "01811223344",
          joinDate: new Date("2023-09-01")
        }
      ];
      
      for (const worker of workers) {
        await this.createWorker(worker);
      }
      
      // Add some expenses
      const expenses = [
        {
          siteId: site.id,
          category: "Materials",
          amount: 25750,
          date: new Date(),
          description: "Cement purchase",
          hasReceipt: false,
          receiptUrl: ""
        },
        {
          siteId: site.id,
          category: "Labor",
          amount: 12000,
          date: new Date(),
          description: "Weekly labor payment",
          hasReceipt: false,
          receiptUrl: ""
        }
      ];
      
      for (const expense of expenses) {
        await this.createExpense(expense);
      }
    }
    
    // Create default user if none exists
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      await this.createUser({
        username: "admin",
        password: "admin123",
        role: "admin"
      });
    }
  }
}