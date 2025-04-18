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

export interface IStorage {
  // Site operations
  getSites(): Promise<Site[]>;
  getSite(id: number): Promise<Site | undefined>;
  createSite(site: InsertSite): Promise<Site>;
  updateSite(id: number, site: Partial<InsertSite>): Promise<Site | undefined>;
  deleteSite(id: number): Promise<boolean>;

  // Material operations
  getMaterials(siteId: number): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
  getLowStockMaterials(siteId: number): Promise<Material[]>;

  // Material Transaction operations
  getMaterialTransactions(siteId: number): Promise<MaterialTransaction[]>;
  getMaterialTransactionsByMaterial(materialId: number): Promise<MaterialTransaction[]>;
  createMaterialTransaction(transaction: InsertMaterialTransaction): Promise<MaterialTransaction>;
  
  // Worker operations
  getWorkers(siteId: number): Promise<Worker[]>;
  getWorker(id: number): Promise<Worker | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: number, worker: Partial<InsertWorker>): Promise<Worker | undefined>;
  deleteWorker(id: number): Promise<boolean>;

  // Attendance operations
  getAttendance(siteId: number, date: Date): Promise<Attendance[]>;
  getAttendanceByWorker(workerId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  
  // Expense operations
  getExpenses(siteId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Photo operations
  getPhotos(siteId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<boolean>;

  // Note operations
  getNotes(siteId: number): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private sites: Map<number, Site>;
  private materials: Map<number, Material>;
  private materialTransactions: Map<number, MaterialTransaction>;
  private workers: Map<number, Worker>;
  private attendance: Map<number, Attendance>;
  private expenses: Map<number, Expense>;
  private photos: Map<number, Photo>;
  private notes: Map<number, Note>;
  private users: Map<number, User>;
  
  private siteId: number;
  private materialId: number;
  private materialTransactionId: number;
  private workerId: number;
  private attendanceId: number;
  private expenseId: number;
  private photoId: number;
  private noteId: number;
  private userId: number;

  constructor() {
    this.sites = new Map();
    this.materials = new Map();
    this.materialTransactions = new Map();
    this.workers = new Map();
    this.attendance = new Map();
    this.expenses = new Map();
    this.photos = new Map();
    this.notes = new Map();
    this.users = new Map();
    
    this.siteId = 1;
    this.materialId = 1;
    this.materialTransactionId = 1;
    this.workerId = 1;
    this.attendanceId = 1;
    this.expenseId = 1;
    this.photoId = 1;
    this.noteId = 1;
    this.userId = 1;
    
    // Initialize with sample data
    this.createInitialData();
  }

  // Helper to create initial data for demo
  private createInitialData() {
    // Create a sample site
    const dhakaSite: InsertSite = {
      name: "Dhaka Residence",
      location: "Gulshan, Dhaka",
      description: "A residential building project in Gulshan",
      startDate: new Date("2023-09-01"),
      expectedEndDate: new Date("2024-06-30"),
      status: "ongoing"
    };
    
    this.createSite(dhakaSite).then(site => {
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
      
      materials.forEach(material => this.createMaterial(material));
      
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
      
      workers.forEach(worker => this.createWorker(worker));
      
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
      
      expenses.forEach(expense => this.createExpense(expense));
    });
    
    // Create default user
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "admin"
    });
  }

  // Site operations
  async getSites(): Promise<Site[]> {
    return Array.from(this.sites.values());
  }

  async getSite(id: number): Promise<Site | undefined> {
    return this.sites.get(id);
  }

  async createSite(site: InsertSite): Promise<Site> {
    const id = this.siteId++;
    const newSite: Site = { ...site, id };
    this.sites.set(id, newSite);
    return newSite;
  }

  async updateSite(id: number, site: Partial<InsertSite>): Promise<Site | undefined> {
    const existingSite = this.sites.get(id);
    if (!existingSite) return undefined;
    
    const updatedSite: Site = { ...existingSite, ...site };
    this.sites.set(id, updatedSite);
    return updatedSite;
  }

  async deleteSite(id: number): Promise<boolean> {
    return this.sites.delete(id);
  }

  // Material operations
  async getMaterials(siteId: number): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(m => m.siteId === siteId);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const id = this.materialId++;
    const lastUpdated = new Date();
    const newMaterial: Material = { ...material, id, lastUpdated };
    this.materials.set(id, newMaterial);
    return newMaterial;
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    const existingMaterial = this.materials.get(id);
    if (!existingMaterial) return undefined;
    
    const updatedMaterial: Material = { 
      ...existingMaterial, 
      ...material, 
      lastUpdated: new Date() 
    };
    this.materials.set(id, updatedMaterial);
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    return this.materials.delete(id);
  }

  async getLowStockMaterials(siteId: number): Promise<Material[]> {
    return Array.from(this.materials.values())
      .filter(m => m.siteId === siteId && m.quantity < m.minStockLevel);
  }

  // Material Transaction operations
  async getMaterialTransactions(siteId: number): Promise<MaterialTransaction[]> {
    return Array.from(this.materialTransactions.values())
      .filter(t => t.siteId === siteId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getMaterialTransactionsByMaterial(materialId: number): Promise<MaterialTransaction[]> {
    return Array.from(this.materialTransactions.values())
      .filter(t => t.materialId === materialId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createMaterialTransaction(transaction: InsertMaterialTransaction): Promise<MaterialTransaction> {
    const id = this.materialTransactionId++;
    const newTransaction: MaterialTransaction = { ...transaction, id };
    this.materialTransactions.set(id, newTransaction);
    
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
    return Array.from(this.workers.values()).filter(w => w.siteId === siteId);
  }

  async getWorker(id: number): Promise<Worker | undefined> {
    return this.workers.get(id);
  }

  async createWorker(worker: InsertWorker): Promise<Worker> {
    const id = this.workerId++;
    const newWorker: Worker = { ...worker, id };
    this.workers.set(id, newWorker);
    return newWorker;
  }

  async updateWorker(id: number, worker: Partial<InsertWorker>): Promise<Worker | undefined> {
    const existingWorker = this.workers.get(id);
    if (!existingWorker) return undefined;
    
    const updatedWorker: Worker = { ...existingWorker, ...worker };
    this.workers.set(id, updatedWorker);
    return updatedWorker;
  }

  async deleteWorker(id: number): Promise<boolean> {
    return this.workers.delete(id);
  }

  // Attendance operations
  async getAttendance(siteId: number, date: Date): Promise<Attendance[]> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.attendance.values())
      .filter(a => {
        const attendanceDateStr = a.date.toISOString().split('T')[0];
        return a.siteId === siteId && attendanceDateStr === dateString;
      });
  }

  async getAttendanceByWorker(workerId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values())
      .filter(a => a.workerId === workerId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceId++;
    const newAttendance: Attendance = { ...attendance, id };
    this.attendance.set(id, newAttendance);
    return newAttendance;
  }

  async updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const existingAttendance = this.attendance.get(id);
    if (!existingAttendance) return undefined;
    
    const updatedAttendance: Attendance = { ...existingAttendance, ...attendance };
    this.attendance.set(id, updatedAttendance);
    return updatedAttendance;
  }

  // Expense operations
  async getExpenses(siteId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(e => e.siteId === siteId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.expenseId++;
    const newExpense: Expense = { ...expense, id };
    this.expenses.set(id, newExpense);
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existingExpense = this.expenses.get(id);
    if (!existingExpense) return undefined;
    
    const updatedExpense: Expense = { ...existingExpense, ...expense };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Photo operations
  async getPhotos(siteId: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(p => p.siteId === siteId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const id = this.photoId++;
    const date = new Date();
    const newPhoto: Photo = { ...photo, id, date };
    this.photos.set(id, newPhoto);
    return newPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }

  // Note operations
  async getNotes(siteId: number): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(n => n.siteId === siteId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(note: InsertNote): Promise<Note> {
    const id = this.noteId++;
    const date = new Date();
    const newNote: Note = { ...note, id, date };
    this.notes.set(id, newNote);
    return newNote;
  }

  async updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined> {
    const existingNote = this.notes.get(id);
    if (!existingNote) return undefined;
    
    const updatedNote: Note = { 
      ...existingNote, 
      ...note, 
      date: new Date() 
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
}

import { DatabaseStorage } from "./dbStorage";

// Create and export the database storage instance
const dbStorage = new DatabaseStorage();

// Initialize data for the database
dbStorage.seedData().catch(err => {
  console.error("Error seeding database:", err);
});

export const storage = dbStorage;
