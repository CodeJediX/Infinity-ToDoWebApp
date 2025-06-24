document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const dom = {
        taskListsContainer: document.getElementById('task-lists'),
        newListBtn: document.getElementById('new-list-btn'),
        currentListTitle: document.getElementById('current-list-title'),
        taskListContainer: document.getElementById('task-list-container'),
        addTaskBtn: document.getElementById('add-task-btn'),
        taskForm: {
            container: document.getElementById('task-form-container'),
            titleInput: document.getElementById('task-title-input'),
            dueDateInput: document.getElementById('due-date-input'),
            saveBtn: document.getElementById('save-task-btn'),
            cancelBtn: document.getElementById('cancel-task-btn'),
        },
        searchBar: document.getElementById('search-bar'),
        calendar: document.getElementById('calendar'),
        clock: document.getElementById('clock'),
        modal: {
            backdrop: document.getElementById('modal-backdrop'),
            content: document.getElementById('modal-content'),
            title: document.getElementById('modal-title'),
            text: document.getElementById('modal-text'),
            input: document.getElementById('modal-input'),
            confirmBtn: document.getElementById('modal-confirm-btn'),
            cancelBtn: document.getElementById('modal-cancel-btn'),
        },
        // --- NEW DOM ELEMENTS ---
        motivation: {
            progressBar: document.getElementById('progress-bar'),
            progressText: document.getElementById('progress-text'),
            conqueredLogList: document.getElementById('conquered-log-list'),
        },
        smartSuggestBtn: document.getElementById('smart-suggest-btn'),
    };

    // --- APP STATE ---
    let state = {
        lists: [],
        tasks: {}, // { "listId": [ {id, title, ..., completedOn} ] }
        activeListId: null,
        editingTaskId: null,
        calendarDate: new Date(),
        selectedDate: null, // YYYY-MM-DD format
    };

    // --- DATA HANDLING (LOCAL STORAGE) ---
    function loadState() {
        // Using a new key `knightTaskStateV3` to avoid conflicts and add new features safely.
        const storedState = JSON.parse(localStorage.getItem('knightTaskStateV3'));
        if (storedState) {
            state = { ...state, ...storedState };
            state.calendarDate = new Date(state.calendarDate);
        } else {
            // Default state for first-time users
            const list1Id = `list-${Date.now()}`;
            state.lists = [{ id: list1Id, name: 'Personal Quests' }];
            state.tasks[list1Id] = [
                { id: Date.now(), title: 'Conquer the gym', priority: 'Medium', dueDate: '', completed: false, completedOn: null },
                { id: Date.now() + 1, title: 'Read a chapter', priority: 'Low', dueDate: '', completed: true, completedOn: '2023-10-26' }
            ];
            state.activeListId = list1Id;
        }
    }

    function saveState() {
        localStorage.setItem('knightTaskStateV3', JSON.stringify(state));
    }

    // --- RENDER FUNCTIONS ---
    function render() {
        renderClock();
        renderLists();
        renderTasks();
        renderCalendar();
        // --- NEW RENDER CALLS ---
        renderMotivationEngine();
        updateDisplay();
    }
    
    function updateDisplay() {
        const activeList = state.lists.find(l => l.id === state.activeListId);
        dom.currentListTitle.textContent = activeList ? activeList.name : "No List Selected";
    }

    function renderLists() {
        dom.taskListsContainer.innerHTML = '';
        state.lists.forEach(list => {
            const li = document.createElement('li');
            li.dataset.listId = list.id;
            if (list.id === state.activeListId) {
                li.classList.add('active');
            }

            li.innerHTML = `
                <span class="list-name">${list.name}</span>
                <div class="list-actions">
                    <button class="edit-list-btn" title="Rename list"><i class="fa-solid fa-pencil"></i></button>
                    <button class="delete-list-btn" title="Delete list"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            dom.taskListsContainer.appendChild(li);
        });
    }

    function renderTasks() {
        dom.taskListContainer.innerHTML = '';
        if (!state.activeListId || !state.tasks[state.activeListId]) {
            dom.taskListContainer.innerHTML = '<p class="placeholder-text">Select a list to see your tasks.</p>';
            return;
        }

        const searchTerm = dom.searchBar.value.toLowerCase();
        let tasksToRender = state.tasks[state.activeListId]
            .filter(task => task.title.toLowerCase().includes(searchTerm))
            .filter(task => !state.selectedDate || task.dueDate === state.selectedDate);
        
        const incompleteTasks = tasksToRender.filter(t => !t.completed);
        const completedTasks = tasksToRender.filter(t => t.completed);
        
        dom.taskListContainer.appendChild(createTaskSection('Actionable Quests', incompleteTasks));
        dom.taskListContainer.appendChild(createTaskSection('Conquered', completedTasks));
    }
    
    function createTaskSection(title, tasks) {
        const section = document.createElement('div');
        section.className = 'task-section';
        const sectionTitle = document.createElement('h3');
        sectionTitle.className = 'task-section-title';
        sectionTitle.textContent = `${title} (${tasks.length})`;
        section.appendChild(sectionTitle);
        if(tasks.length === 0) {
            section.innerHTML += `<p class="placeholder-text">No tasks in this category.</p>`;
        } else {
             tasks.forEach(task => section.appendChild(createTaskElement(task)));
        }
        return section;
    }

    function createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.classList.add('task-item');
        if(task.completed) taskEl.classList.add('completed');
        taskEl.dataset.taskId = task.id;

        const priority = task.priority || 'Low';
        taskEl.innerHTML = `
            <div class="task-item-left">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} title="Toggle complete">
                <div>
                    <span class="task-title-text">${task.title}</span>
                </div>
            </div>
            <div class="task-item-right">
                ${task.dueDate ? `<span class="due-date">${new Date(task.dueDate + 'T00:00:00').toLocaleDateString()}</span>` : ''}
                <span class="priority-tag ${priority}">${priority}</span>
                <div class="actions">
                    <button class="edit-task-btn" title="Edit task"><i class="fas fa-edit"></i></button>
                    <button class="delete-task-btn" title="Delete task"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
        return taskEl;
    }

    function renderCalendar() {
        const calDate = state.calendarDate;
        const month = calDate.getMonth();
        const year = calDate.getFullYear();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const dueDates = new Set(Object.values(state.tasks).flat().map(t => t.dueDate).filter(Boolean));

        let header = `
            <div id="calendar-header">
                <button id="prev-month-btn">&lt;</button>
                <h3>${monthNames[month]} ${year}</h3>
                <button id="next-month-btn">&gt;</button>
            </div>`;
        let days = '<div id="calendar-grid"><div class="day-name">Su</div><div class="day-name">Mo</div><div class="day-name">Tu</div><div class="day-name">We</div><div class="day-name">Th</div><div class="day-name">Fr</div><div class="day-name">Sa</div>';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        for(let i = 0; i < firstDay; i++) {
            days += `<div></div>`;
        }

        for(let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            let classList = 'day';
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                classList += ' today';
            }
            if(dateStr === state.selectedDate) {
                 classList += ' selected';
            }
            if(dueDates.has(dateStr)) {
                classList += ' has-task'
            }
            days += `<div class="${classList}" data-date="${dateStr}">${i}</div>`;
        }
        days += '</div>';
        dom.calendar.innerHTML = header + days;
    }
    
    function renderClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        dom.clock.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // --- NEW: MOTIVATION ENGINE RENDER ---
    function renderMotivationEngine() {
        const tasks = state.tasks[state.activeListId] || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;

        // 1. Progress Bar
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        dom.motivation.progressBar.style.width = `${progressPercentage}%`;
        dom.motivation.progressText.textContent = `${Math.round(progressPercentage)}% Conquered`;
        
        // 2. "Got-Done" Log for Today
        dom.motivation.conqueredLogList.innerHTML = '';
        const todayStr = new Date().toISOString().split('T')[0];
        const allCompletedToday = Object.values(state.tasks).flat()
            .filter(t => t.completed && t.completedOn === todayStr)
            .sort((a, b) => b.id - a.id); // Show most recent first

        if (allCompletedToday.length === 0) {
            const li = document.createElement('li');
            li.textContent = "No quests conquered yet today.";
            li.style.textDecoration = 'none'; // Overwrite style
            dom.motivation.conqueredLogList.appendChild(li);
        } else {
            allCompletedToday.forEach(task => {
                const li = document.createElement('li');
                li.innerHTML = `<i class="fa-solid fa-check"></i> ${task.title}`;
                dom.motivation.conqueredLogList.appendChild(li);
            });
        }
    }


    // --- TASK FORM LOGIC ---
    function showTaskForm(task = null) {
        state.editingTaskId = task ? task.id : null;
        dom.taskForm.container.classList.remove('hidden');
        dom.addTaskBtn.classList.add('hidden');

        dom.taskForm.titleInput.value = task ? task.title : '';
        dom.taskForm.dueDateInput.value = task ? task.dueDate : '';
        const priority = task ? task.priority : 'Low';
        document.querySelector(`input[name="priority"][value="${priority}"]`).checked = true;
        dom.taskForm.titleInput.focus();
    }

    function closeTaskForm() {
        dom.taskForm.container.classList.add('hidden');
        dom.addTaskBtn.classList.remove('hidden');
        state.editingTaskId = null;
    }

    // --- MODAL LOGIC ---
    let modalConfirmCallback = null;
    function showModal({ title, text, showInput = false, inputValue = '', placeholder = '', confirmText = 'Confirm' }) {
        dom.modal.title.textContent = title;
        dom.modal.text.textContent = text;
        dom.modal.input.value = inputValue;
        dom.modal.input.placeholder = placeholder;
        dom.modal.confirmBtn.textContent = confirmText;
        
        dom.modal.input.classList.toggle('hidden', !showInput);
        dom.modal.backdrop.classList.remove('hidden');
        if (showInput) dom.modal.input.focus();
    }

    function closeModal() {
        dom.modal.backdrop.classList.add('hidden');
        modalConfirmCallback = null;
    }

    // --- EVENT HANDLERS ---
    function handleListActions(e) {
        const listEl = e.target.closest('li');
        if (!listEl) return;
        const listId = listEl.dataset.listId;

        if (e.target.matches('.list-name')) {
            state.activeListId = listId;
            state.selectedDate = null;
            closeTaskForm();
            saveState();
            render();
        }
        if (e.target.closest('.edit-list-btn')) {
            const list = state.lists.find(l => l.id === listId);
            showModal({
                title: 'Rename List',
                text: `Enter a new name for "${list.name}":`,
                showInput: true,
                inputValue: list.name,
                confirmText: 'Rename',
            });
            modalConfirmCallback = (newName) => {
                if(newName && newName.trim()) {
                    list.name = newName.trim();
                    saveState();
                    render();
                    closeModal();
                }
            };
        }
        if (e.target.closest('.delete-list-btn')) {
            if (state.lists.length <= 1) {
                showModal({ title: "Cannot Delete", text: "You must have at least one list.", confirmText: "OK"});
                modalConfirmCallback = closeModal;
                return;
            }
            const list = state.lists.find(l => l.id === listId);
            showModal({ title: 'Delete List', text: `Are you sure you want to delete "${list.name}" and all its tasks? This cannot be undone.`, confirmText: 'Delete' });
            modalConfirmCallback = () => {
                state.lists = state.lists.filter(l => l.id !== listId);
                delete state.tasks[listId];
                if (state.activeListId === listId) {
                    state.activeListId = state.lists[0]?.id || null;
                }
                saveState();
                render();
                closeModal();
            };
        }
    }

    function handleNewList() {
        showModal({
            title: 'Create New List',
            text: 'Enter the name for your new list:',
            showInput: true,
            placeholder: 'e.g., Epic Adventures',
            confirmText: 'Create'
        });
        modalConfirmCallback = (listName) => {
            if(listName && listName.trim()) {
                const newId = `list-${Date.now()}`;
                state.lists.push({ id: newId, name: listName.trim() });
                state.tasks[newId] = [];
                state.activeListId = newId;
                saveState();
                render();
                closeModal();
            }
        };
    }
    
    function handleSaveTask() {
        const title = dom.taskForm.titleInput.value.trim();
        if (!title) return;

        const taskData = {
            title,
            priority: document.querySelector('input[name="priority"]:checked').value,
            dueDate: dom.taskForm.dueDateInput.value,
        };
        if (state.editingTaskId) {
            const taskIndex = state.tasks[state.activeListId].findIndex(t => t.id === state.editingTaskId);
            if (taskIndex > -1) {
                const originalTask = state.tasks[state.activeListId][taskIndex];
                state.tasks[state.activeListId][taskIndex] = { ...originalTask, ...taskData };
            }
        } else {
             if (!state.tasks[state.activeListId]) {
                 state.tasks[state.activeListId] = [];
             }
            // Ensure new tasks have all required fields
            state.tasks[state.activeListId].push({ ...taskData, id: Date.now(), completed: false, completedOn: null });
        }
        
        saveState();
        renderTasks();
        renderCalendar();
        renderMotivationEngine(); // NEW: Update progress
        closeTaskForm();
    }
    
    function handleTaskActions(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        const taskId = Number(taskItem.dataset.taskId);
        const taskIndex = state.tasks[state.activeListId].findIndex(t => t.id === taskId);
        if (taskIndex < 0) return;

        let shouldReRender = true;

        if (e.target.closest('.delete-task-btn')) {
            state.tasks[state.activeListId].splice(taskIndex, 1);
        } 
        else if (e.target.closest('.edit-task-btn')) {
            showTaskForm(state.tasks[state.activeListId][taskIndex]);
            shouldReRender = false;
        }
        else if (e.target.classList.contains('task-checkbox')) {
            const isCompleted = e.target.checked;
            state.tasks[state.activeListId][taskIndex].completed = isCompleted;
            // NEW: Add completed date for Got-Done Log
            state.tasks[state.activeListId][taskIndex].completedOn = isCompleted ? new Date().toISOString().split('T')[0] : null;
        } else {
            shouldReRender = false;
        }
        
        if (shouldReRender) {
            saveState();
            renderTasks();
            renderMotivationEngine(); // NEW: Update progress and log
        }
    }
    
    function handleCalendarActions(e) {
        if (e.target.id === 'prev-month-btn') {
            state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
            renderCalendar();
        }
        if (e.target.id === 'next-month-btn') {
            state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
            renderCalendar();
        }
        if (e.target.matches('.day')) {
            const clickedDate = e.target.dataset.date;
            state.selectedDate = state.selectedDate === clickedDate ? null : clickedDate;
            renderCalendar();
            renderTasks();
        }
    }

    // --- NEW: SMART PRIORITIZATION ---
    function handleSmartSuggest() {
        const incompleteTasks = (state.tasks[state.activeListId] || []).filter(t => !t.completed);
        
        if (incompleteTasks.length === 0) {
            showModal({ title: "All Quests Conquered!", text: "There are no scannable quests in this list. Add a new one!", confirmText: "OK" });
            modalConfirmCallback = closeModal;
            return;
        }

        const priorityValues = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const today = new Date();
        today.setHours(0,0,0,0); // Normalize today's date

        let bestTask = null;
        let maxScore = -Infinity;

        incompleteTasks.forEach(task => {
            let score = 0;
            // 1. Priority Score (main factor)
            score += (priorityValues[task.priority] || 1) * 10;

            // 2. Due Date Score
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate + 'T00:00:00');
                const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                
                if (diffDays < 0) { // Overdue
                    score += 50; // High bonus for being overdue
                } else if (diffDays === 0) { // Due today
                    score += 25;
                } else { // Due in the future
                    score += 10 / (diffDays + 1); // Closer dates get more points
                }
            }

            if (score > maxScore) {
                maxScore = score;
                bestTask = task;
            }
        });

        if (bestTask) {
            showModal({
                title: "Your Next Suggested Quest",
                text: `The Oracle suggests you focus on: "${bestTask.title}" (Priority: ${bestTask.priority}${bestTask.dueDate ? ', Due: ' + new Date(bestTask.dueDate + 'T00:00:00').toLocaleDateString() : ''})`,
                confirmText: "I Accept!",
            });
            modalConfirmCallback = closeModal;
        }
    }


    // --- INITIALIZATION ---
    function init() {
        // Event Listeners
        dom.taskListsContainer.addEventListener('click', handleListActions);
        dom.newListBtn.addEventListener('click', handleNewList);
        dom.addTaskBtn.addEventListener('click', () => showTaskForm());
        dom.taskForm.cancelBtn.addEventListener('click', closeTaskForm);
        dom.taskForm.saveBtn.addEventListener('click', handleSaveTask);
        dom.taskListContainer.addEventListener('click', handleTaskActions);
        dom.searchBar.addEventListener('input', renderTasks);
        dom.calendar.addEventListener('click', handleCalendarActions);
        dom.smartSuggestBtn.addEventListener('click', handleSmartSuggest); // NEW
        
        // Modal Listeners
        dom.modal.cancelBtn.addEventListener('click', closeModal);
        dom.modal.confirmBtn.addEventListener('click', () => {
             if(modalConfirmCallback) {
                 const inputValue = dom.modal.input.classList.contains('hidden') ? null : dom.modal.input.value;
                 modalConfirmCallback(inputValue);
             }
        });
        dom.modal.backdrop.addEventListener('click', (e) => {
            if (e.target === dom.modal.backdrop) closeModal();
        });
        
        // Load data and render UI
        loadState();
        setInterval(renderClock, 1000); // Start clock
        render(); // Initial render
    }

    init();
});