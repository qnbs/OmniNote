
import { Note, Template } from '../types/note';

const DB_NAME = 'OmniNoteDB';
const DB_VERSION = 1;
const STORE_NOTES = 'notes';
const STORE_TEMPLATES = 'templates';

class StorageDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NOTES)) {
                    db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
                    db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
                }
            };
        });
    }

    private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
        if (!this.db) throw new Error("Database not initialized");
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    async getAllNotes(): Promise<Note[]> {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            const request = this.getStore(STORE_NOTES).getAll();
            request.onsuccess = () => resolve(request.result as Note[]);
            request.onerror = () => reject(request.error);
        });
    }

    async saveNote(note: Note): Promise<void> {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            const request = this.getStore(STORE_NOTES, 'readwrite').put(note);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveNotes(notes: Note[]): Promise<void> {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            if(!this.db) return reject("No DB");
            const transaction = this.db.transaction(STORE_NOTES, 'readwrite');
            const store = transaction.objectStore(STORE_NOTES);
            
            notes.forEach(note => store.put(note));
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async deleteNote(id: string): Promise<void> {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            const request = this.getStore(STORE_NOTES, 'readwrite').delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async deleteNotes(ids: string[]): Promise<void> {
         await this.ensureInit();
         return new Promise((resolve, reject) => {
            if(!this.db) return reject("No DB");
            const transaction = this.db.transaction(STORE_NOTES, 'readwrite');
            const store = transaction.objectStore(STORE_NOTES);
            
            ids.forEach(id => store.delete(id));
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getAllTemplates(): Promise<Template[]> {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            const request = this.getStore(STORE_TEMPLATES).getAll();
            request.onsuccess = () => resolve(request.result as Template[]);
            request.onerror = () => reject(request.error);
        });
    }

    async saveTemplate(template: Template): Promise<void> {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            const request = this.getStore(STORE_TEMPLATES, 'readwrite').put(template);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveTemplates(templates: Template[]): Promise<void> {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            if(!this.db) return reject("No DB");
            const transaction = this.db.transaction(STORE_TEMPLATES, 'readwrite');
            const store = transaction.objectStore(STORE_TEMPLATES);
            
            templates.forEach(t => store.put(t));
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async deleteTemplate(id: string): Promise<void> {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            const request = this.getStore(STORE_TEMPLATES, 'readwrite').delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async ensureInit() {
        if (!this.db) await this.init();
    }
}

export const storage = new StorageDB();
