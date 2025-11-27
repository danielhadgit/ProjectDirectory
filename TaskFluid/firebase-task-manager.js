import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

export class TaskManager {
    constructor(db, userId) {
        this.db = db;
        this.userId = userId;
    }

    async createTask(listId, taskData) {
        try {
            const task = {
                ...taskData,
                userId: this.userId,
                listId: listId,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(this.db, "tasks"), task);
            return { id: docRef.id, ...task };
        } catch (error) {
            console.error("Error creating task:", error);
            throw error;
        }
    }

    async updateTask(taskId, updates) {
        try {
            const taskRef = doc(this.db, "tasks", taskId);
            await updateDoc(taskRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error updating task:", error);
            throw error;
        }
    }

    async deleteTask(taskId) {
        try {
            await deleteDoc(doc(this.db, "tasks", taskId));
        } catch (error) {
            console.error("Error deleting task:", error);
            throw error;
        }
    }

    async getTasks() {
        try {
            const q = query(
                collection(this.db, "tasks"),
                where("userId", "==", this.userId)
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting tasks:", error);
            throw error;
        }
    }

    async createList(name) {
        try {
            const list = {
                name,
                userId: this.userId,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(this.db, "lists"), list);
            return { id: docRef.id, ...list };
        } catch (error) {
            console.error("Error creating list:", error);
            throw error;
        }
    }

    async getLists() {
        try {
            const q = query(
                collection(this.db, "lists"),
                where("userId", "==", this.userId)
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting lists:", error);
            throw error;
        }
    }
}