import { db } from "./db";
import { eq, and, lt, desc } from "drizzle-orm";
import { 
  sites, type Site, type InsertSite,
  materials, type Material, type InsertMaterial,
  users, type User, type InsertUser,
  expenses, type Expense, type InsertExpense,
  workers, type Worker, type InsertWorker
} from "@shared/schema";
import { IStorage } from "./storage";

// This is a simplified database storage implementation focusing on the most essential operations
export class SimpleDbStorage implements Partial<IStorage> {
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
    const materialToInsert = {
      ...material,
      lastUpdated: new Date()
    };
    const [newMaterial] = await db
      .insert(materials)
      .values(materialToInsert)
      .returning();
    return newMaterial;
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
  async seedInitialData() {
    // Check if we have any sites, if not create a default one
    const existingSites = await this.getSites();
    if (existingSites.length === 0) {
      // Create a sample site
      const dhakaSite: InsertSite = {
        name: "Dhaka Residence",
        location: "Gulshan, Dhaka",
        description: "A residential building project in Gulshan",
        startDate: new Date("2023-09-01").toISOString(),
        expectedEndDate: new Date("2024-06-30").toISOString(),
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
          joinDate: new Date("2023-09-01").toISOString()
        },
        {
          siteId: site.id,
          name: "Mohammad Ali",
          role: "Helper",
          dailyWage: 500,
          phone: "01811223344",
          joinDate: new Date("2023-09-01").toISOString()
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
          date: new Date().toISOString(),
          description: "Cement purchase",
          hasReceipt: false,
          receiptUrl: ""
        },
        {
          siteId: site.id,
          category: "Labor",
          amount: 12000,
          date: new Date().toISOString(),
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