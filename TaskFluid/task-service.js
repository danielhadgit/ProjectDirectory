import { db } from './firebase-config.js';
import { 
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Create a new task
export async function createTask(userId, listId, taskData) {
    try {
        const tasksRef = collection(db, "tasks");
        const task = {
            ...taskData,
            userId,
            listId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(tasksRef, task);
        return { id: docRef.id, ...task };
    } catch (error) {
        throw error;
    }
}

// Update a task
export async function updateTask(taskId, taskData) {
    try {
        const taskRef = doc(db, "tasks", taskId);
        const updates = {
            ...taskData,
            updatedAt: new Date().toISOString()
        };
        await updateDoc(taskRef, updates);
        return { id: taskId, ...updates };
    } catch (error) {
        throw error;
    }
}

// Delete a task
export async function deleteTask(taskId) {
    try {
        await deleteDoc(doc(db, "tasks", taskId));
        return taskId;
    } catch (error) {
        throw error;
    }
}

// Get all tasks for a list
export async function getTasksByList(userId, listId) {
    try {
        const tasksRef = collection(db, "tasks");
        const q = query(
            tasksRef,
            where("userId", "==", userId),
            where("listId", "==", listId),
            orderBy("createdAt")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw error;
    }
}

// Create a new list
export async function createList(userId, listData) {
    try {
        const listsRef = collection(db, "lists");
        const list = {
            ...listData,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(listsRef, list);
        return { id: docRef.id, ...list };
    } catch (error) {
        throw error;
    }
}

// Get all lists for a user
export async function getUserLists(userId) {
    try {
        const listsRef = collection(db, "lists");
        const q = query(
            listsRef,
            where("userId", "==", userId),
            orderBy("createdAt")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw error;
    }
}

// Update list order (for drag and drop)
export async function updateListOrder(listId, newOrder) {
    try {
        const listRef = doc(db, "lists", listId);
        await updateDoc(listRef, {
            order: newOrder,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        throw error;
    }
}

// Update task order within a list (for drag and drop)
export async function updateTaskOrder(taskId, newListId, newOrder) {
    try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
            listId: newListId,
            order: newOrder,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        throw error;
    }
}