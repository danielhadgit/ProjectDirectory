import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import TaskManager from './task-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    const { auth, db } = window.firebaseInstance;
    let taskManager = null;

    // Cache DOM elements
    const modal = document.getElementById('taskModal');
    const taskForm = document.getElementById('taskForm');
    const listsContainer = document.querySelector('.lists-container');
    let currentList = null;
    let selectedPriority = 'medium';
    let editingTask = null;

    function openModal() {
        if (!taskManager) {
            console.error('TaskManager not initialized');
            return;
        }
        modal.style.display = 'flex';
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        selectedPriority = 'medium';
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.priority === 'medium') {
                btn.classList.add('active');
            }
        });
    }

    function closeTaskModal() {
        modal.style.display = 'none';
        editingTask = null;
        taskForm.reset();
    }

    // Setup modal close button
    document.querySelector('.close-modal').addEventListener('click', closeTaskModal);

    // Priority buttons
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPriority = btn.dataset.priority;
        });
    });

    async function loadTasks() {
        try {
            const tasks = await taskManager.getTasks();
            clearAllTasks();
            tasks.forEach(task => {
                const taskElement = createTaskElement(task);
                const listElement = document.querySelector(`[data-list-id="${task.listId}"] .task-list`);
                if (listElement) {
                    listElement.appendChild(taskElement);
                    setupDragAndDrop(taskElement);
                }
            });
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    function clearAllTasks() {
        document.querySelectorAll('.task-list').forEach(list => {
            list.innerHTML = '';
        });
    }

    function createTaskElement(taskData) {
        const task = document.createElement('div');
        task.className = 'task glass-card';
        task.draggable = true;
        task.dataset.taskId = taskData.id;
        task.innerHTML = getTaskHTML(taskData.title, taskData.description, taskData.priority);
        setupDragAndDrop(task);
        return task;
    }

    function updateTaskElement(taskElement, title, description, priority) {
        taskElement.className = `task glass-card ${priority}`;
        taskElement.querySelector('h4').textContent = title;
        taskElement.querySelector('.task-content p').textContent = description;
    }

    // Add Task Button Click
    listsContainer.addEventListener('click', async (e) => {
        if (!taskManager) {
            console.error('TaskManager not initialized');
            return;
        }
        const addTaskBtn = e.target.closest('.add-task-btn');
        const deleteBtn = e.target.closest('.delete-task');
        const editBtn = e.target.closest('.edit-task');
        if (addTaskBtn) {
            currentList = addTaskBtn.closest('.list');
            console.log('Add Task button clicked for list:', currentList.dataset.listId);
            openModal();
            return;
        }
        if (deleteBtn) {
            const task = deleteBtn.closest('.task');
            if (task) {
                try {
                    await taskManager.deleteTask(task.dataset.taskId);
                    task.remove();
                } catch (error) {
                    console.error('Error deleting task:', error);
                }
            }
            return;
        }
        if (editBtn) {
            const task = editBtn.closest('.task');
            if (task) {
                openModalForEdit(task);
            }
            return;
        }
    });

    // Close modal handlers
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            closeTaskModal();
        });
    }

    // Click outside modal to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTaskModal();
        }
    });

    // Priority button clicks
    const priorityOptions = document.querySelector('.priority-options');
    if (priorityOptions) {
        priorityOptions.addEventListener('click', (e) => {
            const btn = e.target.closest('.priority-btn');
            if (!btn) return;
            
            e.preventDefault(); // Prevent form submission
            selectedPriority = btn.dataset.priority;
            updatePriorityButtons(btn);
        });
    }

    // Form submission
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!taskManager) {
            console.error('TaskManager not initialized');
            return;
        }
        
        console.log('Task form submitted');
        const titleInput = document.getElementById('taskTitle');
        const descriptionInput = document.getElementById('taskDescription');
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        
        if (title && description) {
            try {
                if (editingTask) {
                    // Update existing task
                    await taskManager.updateTask(editingTask.dataset.taskId, {
                        title,
                        description,
                        priority: selectedPriority
                    });
                    updateTaskElement(editingTask, title, description, selectedPriority);
                    editingTask = null;
                    console.log('Task updated:', title);
                } else if (currentList) {
                    // Create new task
                    const listId = currentList.dataset.listId;
                    const taskData = {
                        title,
                        description,
                        priority: selectedPriority,
                    };
                    const newTask = await taskManager.createTask(listId, taskData);
                    const taskElement = createTaskElement(newTask);
                    currentList.querySelector('.task-list').appendChild(taskElement);
                    setupDragAndDrop(taskElement);
                    console.log('Task added:', newTask);
                }
                closeTaskModal();
                taskForm.reset();
            } catch (error) {
                console.error('Error handling task:', error);
            }
        } else {
            alert('Please fill in all fields');
        }
    });

    // Update modal button text for add/edit
    function openModal() {
        modal.style.display = 'flex';
        taskForm.reset();
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        selectedPriority = 'medium';
        updatePriorityButtons(document.querySelector('[data-priority="medium"]'));
        document.querySelector('.modal-header h2').textContent = 'Add Task';
        document.querySelector('.glass-submit-btn').innerHTML = '<i class="fas fa-plus"></i> Add Task';
        editingTask = null;
    }
    function openModalForEdit(task) {
        modal.style.display = 'flex';
        document.querySelector('.modal-header h2').textContent = 'Edit Task';
        document.querySelector('.glass-submit-btn').innerHTML = '<i class="fas fa-save"></i> Save Changes';
        // Fill in existing task details
        const title = task.querySelector('h4').textContent;
        const description = task.querySelector('p').textContent;
        const priority = task.querySelector('.priority-badge').classList[1];
        document.getElementById('taskTitle').value = title;
        document.getElementById('taskDescription').value = description;
        selectedPriority = priority;
        updatePriorityButtons(document.querySelector(`[data-priority="${priority}"]`));
        editingTask = task;
    }

    function closeTaskModal() {
        modal.style.display = 'none';
        editingTask = null;
        taskForm.reset();
    }

    function updatePriorityButtons(selectedBtn) {
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }

    function createTaskElement(taskData) {
        const task = document.createElement('div');
        task.className = 'task glass-card';
        task.draggable = true;
        task.dataset.taskId = taskData.id;
        task.innerHTML = getTaskHTML(taskData.title, taskData.description, taskData.priority);
        setupDragAndDrop(task);
        return task;
    }

    function updateTask(task, title, description, priority) {
        task.innerHTML = getTaskHTML(title, description, priority);
    }

    function getTaskHTML(title, description, priority) {
        const priorityIcon = {
            low: 'fa-arrow-down',
            medium: 'fa-minus',
            high: 'fa-arrow-up'
        }[priority];

        return `
            <div class="task-content">
                <h4>${title}</h4>
                <p>${description}</p>
                <span class="priority-badge ${priority}">
                    <i class="fas ${priorityIcon}"></i> ${priority}
                </span>
            </div>
            <div class="task-actions">
                <button type="button" class="edit-task"><i class="fas fa-edit"></i></button>
                <button type="button" class="delete-task"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }

    function setupDragAndDrop(task) {
        task.draggable = true;
        task.addEventListener('dragstart', () => {
            task.classList.add('dragging');
            task.dataset.originalListId = task.closest('.list').dataset.listId;
        });

        task.addEventListener('dragend', () => {
            task.classList.remove('dragging');
        });
    }

    // Set up drop zones
    document.querySelectorAll('.task-list').forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            const draggable = document.querySelector('.task.dragging');
            if (!draggable) return;

            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement) {
                list.insertBefore(draggable, afterElement);
            } else {
                list.appendChild(draggable);
            }
        });

        list.addEventListener('drop', async (e) => {
            e.preventDefault();
            const task = document.querySelector('.task.dragging');
            if (task) {
                const newList = e.target.closest('.list');
                const newListId = newList.dataset.listId;
                try {
                    await taskManager.updateTask(task.dataset.taskId, {
                        listId: newListId
                    });
                } catch (error) {
                    console.error('Error updating task list:', error);
                    // Revert the move if the update fails
                    const originalList = document.querySelector(`[data-list-id="${task.dataset.originalListId}"] .task-list`);
                    if (originalList) {
                        originalList.appendChild(task);
                    }
                }
            }
        });
    });

    function getDragAfterElement(list, y) {
        const draggableElements = [...list.querySelectorAll('.task:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Load lists from Firestore on page load
    async function loadLists() {
        try {
            const lists = await taskManager.getLists();
            lists.forEach(listData => {
                renderList(listData);
            });
        } catch (error) {
            console.error('Error loading lists:', error);
        }
    }

    // Render a list in the DOM
    function renderList(listData) {
        const list = document.createElement('div');
        list.className = 'list glass-card';
        list.setAttribute('data-list-id', listData.id);
        list.innerHTML = `
            <div class="list-header">
                <h3>${listData.name}</h3>
                <button class="add-task-btn"><i class="fas fa-plus"></i></button>
                <button class="remove-list-btn glass-card" title="Remove List">Delete</button>
            </div>
            <div class="task-list"></div>
        `;
        const addListButton = document.querySelector('.add-list');
        listsContainer.insertBefore(list, addListButton);
        // Remove list button handler
        list.querySelector('.remove-list-btn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this list?')) {
                try {
                    await taskManager.deleteList(listData.id);
                    list.remove();
                } catch (error) {
                    console.error('Error deleting list:', error);
                }
            }
        });
    }

    // Add List Button Click
    document.querySelector('.add-list-btn').addEventListener('click', async () => {
        const name = prompt('Enter list name:');
        if (!name) return;
        try {
            const newList = await taskManager.createList({ name });
            renderList(newList);
        } catch (error) {
            console.error('Error creating list:', error);
        }
    });

    // On user authenticated, load lists
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User authenticated:', user.uid);
            taskManager = new TaskManager(db, user.uid);
            await loadLists();
            await loadTasks();
        } else {
            console.log('User not authenticated, redirecting...');
            window.location.href = 'Signuplogin.html';
        }
    });
});