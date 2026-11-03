const projectSelect = document.querySelector('.project-select');
const projectTabs = document.querySelector('.tabs');
const btnCreateTask = document.getElementById('open-create-task');
const emptyStateP = document.querySelector('.empty-state');
const views = document.querySelectorAll('.view');
const columns = {};
document.querySelectorAll('.column').forEach(column => {
    columns[column.dataset.status] = column
});

const createDialog = document.getElementById('create-task-dialog');
const createForm = document.getElementById('create-task-form');
const taskDialog = document.getElementById('task-dialog');
const taskError = document.getElementById('task-error');

const STATUS_LABELS = {
    inbox: 'Inbox',
    todo: 'To do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done'
};
const PRIORITY_ORDER = ['urgent', 'important', 'medium', 'low', 'lowest'];
const TYPE_ORDER = ['frontend', 'backend', 'deploy', 'design', 'other'];

let currentProjectId = '';
let currentView = 'board-view';
let members = [];
let allTasks = [];
let openTaskId = null;


function ottieniIniziali(nome) {
    return (nome || '?').split(' ').filter(Boolean).map(word => {
        return word[0];
    }).join('').slice(0, 2).toUpperCase();
}

function riempiAvatar(element, user) {
    element.textContent = user ? ottieniIniziali(user.name || user.username) : '?';
    element.title = user ? user.name || user.username : 'Non assegnata';
    element.classList.toggle('avatar-empty', !user);
}

function formattaData(data) {
    return new Date(data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function formattaDateTime(datetime) {
    if (!datetime) return '';
    return new Date(datetime).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function isScaduta(task) {
    const oggi = new Date().toISOString().slice(0, 10);
    return Boolean(task.due_date) && task.status !== 'done' && task.due_date.slice(0, 10) < oggi;
}

function clonaTemplate(id) {
    return document.getElementById(id).content.firstElementChild.cloneNode(true);
}


function mostraView(viewId) {
    currentView = viewId;
    views.forEach(view => {
        view.hidden = view.id !== viewId;
    });
    projectTabs.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewId);
    });
}

function mostraProgetti() {
    projectTabs.hidden = false;
    btnCreateTask.disabled = false;
    emptyStateP.hidden = true;
    mostraView(currentView);
}

function nascondiProgetti() {
    projectTabs.hidden = true;
    btnCreateTask.disabled = true;
    emptyStateP.hidden = false;
    views.forEach(view => view.hidden = true);
}

async function caricaProgetti() {
    try {
        const {data} = await api.get('/projects');
        console.log(`Trovati ${data.count} progetti.`);

        if (data.count < 1) {
            nascondiProgetti();
            return;
        }

        projectSelect.innerHTML = '';
        data.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project._id;
            option.textContent = project.title;
            projectSelect.appendChild(option);
        });

        const salvato = localStorage.getItem('currentProject');
        const esisteSalvato = data.projects.some(project => project._id === salvato);
        mostraProgetti();
        selezionaProgetto(esisteSalvato ? salvato : data.projects[0]._id);
    } catch (err) {
        console.log(getErrorMessage(err));
        nascondiProgetti();
        emptyStateP.textContent = getErrorMessage(err);
    }
}

function selezionaProgetto(projectId) {
    currentProjectId = projectId;
    projectSelect.value = projectId;
    localStorage.setItem('currentProject', projectId);
    console.log(`Progetto corrente: ${currentProjectId}`);
    loadProject(currentProjectId);
}

async function loadProject(projectId) {
    try {
        const {data} = await api.get(`/projects/${projectId}`);
        const project = data.project;

        document.getElementById('project-title').textContent = project.title;
        document.getElementById('project-description').textContent = project.description
        document.getElementById('project-goal').textContent = project.goal || '—';
        const projectStatus = document.getElementById('project-status');
        projectStatus.textContent = project.status;
        projectStatus.dataset.status = project.status;

        await caricaMembri(project);
        await caricaTasks(projectId);
    } catch (err) {
        console.log(getErrorMessage(err));
    }
}

async function caricaMembri(project) {
    members = [{
        _id: currentUser._id,
        name: currentUser.name,
        username: currentUser.username,
    }];
    if (!project.team) return;
    try {
        const {data} = await api.get(`/teams/${project.team}/members`);
        members = data.members;
    } catch (err) {
        console.log(getErrorMessage(err));
    }
}

async function caricaTasks(projectId) {
    try {
        const {data} = await api.get(`/projects/${projectId}/tasks`);
        allTasks = data.tasks;
        console.log(`Trovate ${data.count} task`, data.tasks);
    } catch (err) {
        console.log(getErrorMessage(err));
    }
}


function getTaskFiltrate() {
    const search = document.getElementById('task-search').value.trim().toLowerCase();
    const priority = document.getElementById('filter-priority').value;
    const type = document.getElementById('filter-type').value;
    const mine = document.getElementById('filter-mine').checked;

    return allTasks.filter(task => {
        if (search && !task.summary.toLowerCase().includes(search)) return false;
        if (priority && task.priority !== priority) return false;
        if (type && task.work_type !== type) return false;
        if (mine && !(task.assignee && task.assignee._id === currentUser.id)) return false;
        return true;
    });
}

function renderAll() {
    renderBoard(getTaskFiltrate());
    renderList(allTasks);
    renderSummary(allTasks);
}

function creaTaskCard(task) {
    const card = clonaTemplate('task-card-template');
    card.dataset.id = task._id;
    card.querySelector('.task-summary').textContent = task.summary;

    const type = card.querySelector('.task-type');
    type.textContent = task.work_type;
    type.dataset.type = task.work_type;

    const due = card.querySelector('.task-due');
    if (task.due_date) {
        due.textContent = formattaData(task.due_date);
        due.classList.toggle('overdue', isScaduta(task));
    }

    const priority = card.querySelector('.task-priority');
    priority.dataset.priority = task.priority;
    priority.title = task.priority;

    riempiAvatar(card.querySelector('.task-assignee'), task.assignee);
    return card;
}

function renderBoard(tasks) {
    Object.entries(columns).forEach(([status, column]) => {
        const container = column.querySelector('.column-cards');
        container.innerHTML = '';
        const columnTasks = tasks.filter((task) => task.status === status);
        column.querySelector('.column-count').textContent = columnTasks.length;
        columnTasks.forEach(task => {
            container.appendChild(creaTaskCard(task));
        });
    });
}

function renderList(tasks) {
    const body = document.getElementById('list-body');
    body.innerHTML = '';
    tasks.forEach((task) => {
        const row = clonaTemplate('list-row-template');
        row.dataset.id = task._id;

        const type = row.querySelector('.row-type');
        type.textContent = task.work_type;
        type.dataset.type = task.work_type;

        row.querySelector('.row-summary').textContent = task.summary;

        const status = row.querySelector('.row-status');
        status.textContent = STATUS_LABELS[task.status];
        status.dataset.status = task.status;

        row.querySelector('.row-priority').dataset.priority = task.priority;
        row.querySelector('.row-assignee').textContent = task.assignee ? task.assignee.name || task.assignee.username : '—';
        row.querySelector('.row-due').textContent = task.due_date ? formattaData(task.due_date) : '—';
        body.appendChild(row);
    });
}

function renderBreakdown(containerId, order, field, tasks) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    order.forEach(value => {
        const count = tasks.filter((task) => task[field] === value).length;
        const percent = tasks.length ? Math.round((count / tasks.length) * 100) : 0;

        const row = document.createElement('div');
        row.className = 'bar-row';
        const label = document.createElement('span');
        label.textContent = value;
        const track = document.createElement('div');
        track.className = 'bar-track';
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.width = `${percent}%`;
        track.appendChild(fill);
        const number = document.createElement('span');
        number.textContent = count;

        row.append(label, track, number);
        container.appendChild(row);
    });
}

function renderSummary(tasks) {
    document.querySelectorAll('[data-count]').forEach(element => {
        element.textContent = tasks.filter(task => task.status === element.dataset.count).length;
    });
    renderBreakdown('priority-breakdown', PRIORITY_ORDER, 'priority', tasks);
    renderBreakdown('type-breakdown', TYPE_ORDER, 'work_type', tasks);
}


function riempiSelectAssegnatario(select, selectedUser) {
    select.innerHTML = '';
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'Non assegnata';
    select.appendChild(none);

    const list = [...members];
    if (selectedUser && !list.some(member => member._id === selectedUser._id))
        list.push(selectedUser);

    list.forEach(member => {
        const option = document.createElement('option');
        option.value = member._id;
        option.textContent = member.name || member.username;
        select.appendChild(option);
    });
}

function apriCreateDialog() {
    createForm.reset();
    createForm.querySelector('.form-error').textContent = '';
    riempiSelectAssegnatario(document.getElementById('new-assignee'), null);
    createDialog.showModal();
}

createForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = createForm.querySelector('button[type="submit"]');
    const errorElement = createForm.querySelector('.form-error');
    errorElement.textContent = '';
    button.disabled = true;

    try {
        const body = Object.fromEntries(new FormData(createForm));
        if (!body.due_date) delete body.due_date;
        if (!body.assignee) delete body.assignee;

        await api.post(`/projects/${currentProjectId}/tasks`, body);
        createDialog.close();
        await caricaTasks(currentProjectId);
    } catch (err) {
        errorElement.textContent = getErrorMessage(err);
    } finally {
        button.disabled = false;
    }
});


function riempiTaskForm(task) {
    document.getElementById('task-summary-input').value = task.summary;
    document.getElementById('task-description-input').value = task.description || '';
    document.getElementById('task-status-select').value = task.status;
    riempiSelectAssegnatario(document.getElementById('task-assignee-select'), task.assignee);
    document.getElementById('task-priority-select').value = task.priority;
    document.getElementById('task-type-select').value = task.work_type;
    document.getElementById('task-due-input').value = task.due_date ? task.due_date.slice(0, 10) : '';
    document.getElementById('task-reporter').textContent = task.reporter ? task.reporter.name || task.reporter.username : '—';
}

function creaNota(nota, isComment) {
    const item = clonaTemplate('note-template');
    item.dataset.id = nota._id;
    const author = nota.author;
    riempiAvatar(item.querySelector('.note-avatar'), author);
    item.querySelector('.note-author').textContent = 
        (author && (author.name || author.username)) || 'Utente';
    const data = item.querySelector('.note-date');
    data.textContent = formattaDateTime(nota.createdAt);
    item.querySelector('.note-text').textContent = nota.text;

    if (isComment && nota.isIssue) {
        const badge = item.querySelector('.note-issue');
        badge.hidden = false;
        badge.textContent = nota.resolved ? 'Issue risolta' : 'Issue aperta';
        if (nota.resolved) badge.dataset.status = 'done';
        else badge.dataset.type = 'deploy';

        const resolveButton = item.querySelector('.note-resolve');
        resolveButton.hidden = false;
        resolveButton.textContent = nota.resolved ? 'Riapri' : 'Segna come risolta';
        item.dataset.resolved = nota.resolved;
    }
    return item;
}

function renderNotes(task) {
    const commentList = document.getElementById('comment-list');
    const worklogList = document.getElementById('worklog-list');
    commentList.innerHTML = '';
    worklogList.innerHTML = '';
    task.comments.forEach(comment => {
        commentList.appendChild(creaNota(comment, true));
    });
    task.worklogs.forEach(worklog => {
        worklogList.appendChild(creaNota(worklog, false));
    });
}

async function apriTask(taskId) {
    try {
        const {data} = await api.get(`/tasks/${taskId}`);
        openTaskId = taskId;
        taskError.textContent = '';
        riempiTaskForm(data.task);
        renderNotes(data.task);
        taskDialog.showModal();
    } catch (err) {
        console.log(getErrorMessage(err));
    }
} 

async function ricaricaNotes() {
    const {data} = await api.get(`/tasks/${openTaskId}`);
    renderNotes(data.task);
}

async function salvaTask() {
    taskError.textContent = '';
    try {
        await api.patch(`tasks/${openTaskId}`, {
            summary: document.getElementById('task-summary-input').value,
            description: document.getElementById('task-description-input').value,
            status: document.getElementById('task-status-select').value,
            work_type: document.getElementById('task-type-select').value,
            priority: document.getElementById('task-priority-select').value,
            due_date: document.getElementById('task-due-input').value || null,
            assignee: document.getElementById('task-assignee-select').value || null,
        });
        taskDialog.close();
        await caricaTasks(currentProjectId);
    } catch (err) {
        taskError.textContent = getErrorMessage(err);
    }
}

async function cancellaTask() {
    if (!confirm('Eliminare definitivamente questa task?')) return;
    taskError.textContent = '';
    try {
        await api.delete(`/tasks/${openTaskId}`);
        taskDialog.close();
        await caricaTasks(currentProjectId);
    } catch (err) {
        taskError.textContent = getErrorMessage(err);
    }
}

function handleNoteForm(formId, path, getBody) {
    const form = document.getElementById(formId);
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        taskError.textContent = '';
        try {
            await api.post(`/tasks/${openTaskId}/${path}`, getBody(form));
            form.reset();
            await ricaricaNotes();
        } catch (err) {
            taskError.textContent = getErrorMessage(err);
        }
    });
}

handleNoteForm('comment-form', 'comments', (form) => ({
    text: form.elements.text.value,
    isIssue: form.elements.isIssue.checked,
}));
handleNoteForm('worklog-form', 'worklogs', (form) => ({ text: form.elements.text.value }));

document.getElementById('comment-list').addEventListener('click', async (event) => {
    const item = event.target.closest('.note');
    if (!item) return;
    try {
        if (event.target.closest('.note-delete')) {
            await api.delete(`/tasks/${openTaskId}/comments/${item.dataset.id}`);
        } else if (event.target.closest('.note-resolve')) {
            await api.patch(`/tasks/${openTaskId}/comments/${item.dataset.id}`, {
                resolved: item.dataset.resolved !== 'true',
            });
        } else {
            return;
        }
        await ricaricaNotes();
    } catch (err) {
        taskError.textContent = getErrorMessage(err);
    }
});

document.getElementById('worklog-list').addEventListener('click', async (event) => {
    const item = event.target.closest('.note');
    if (!item || !event.target.closest('.note-delete')) return;
    try {
        await api.delete(`/tasks/${openTaskId}/worklogs/${item.dataset.id}`);
        await ricaricaNotes();
    } catch (err) {
        taskError.textContent = getErrorMessage(err);
    }
});

projectSelect.addEventListener('change', () => selezionaProgetto(projectSelect.value));

projectTabs.addEventListener('click', event => {
    const tab = event.target.closest('.tab');
    if (tab) mostraView(tab.dataset.view);
});

btnCreateTask.addEventListener('click', apriCreateDialog);

['task-search', 'filter-priority', 'filter-type', 'filter-mine'].forEach((id) => {
    document.getElementById(id).addEventListener('input', renderAll);
});

document.querySelector('.board').addEventListener('click', (event) => {
    const card = event.target.closest('.task-card');
    if (card) apriTask(card.dataset.id);
});

document.querySelector('.board').addEventListener('keydown', (event) => {
    const card = event.target.closest('.task-card');
    if (event.key === 'Enter' && card) apriTask(card.dataset.id);
});

document.getElementById('list-body').addEventListener('click', (event) => {
    const row = event.target.closest('.list-row');
    if (row) apriTask(row.dataset.id);
});

document.getElementById('save-task').addEventListener('click', salvaTask);
document.getElementById('delete-task').addEventListener('click', cancellaTask);
document.getElementById('assign-to-me').addEventListener('click', () => {
    document.getElementById('task-assignee-select').value = currentUser.id;
});

document.addEventListener('click', (event) => {
    const closer = event.target.closest('[data-close]');
    if (closer) closer.closest('dialog').close();
});

caricaProgetti();