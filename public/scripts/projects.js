const projectsBody = document.getElementById('projects-body');
const projectsEmpty = document.getElementById('projects-empty');
const projectSearch = document.getElementById('project-search');
const statusFilter = document.getElementById('project-status-filter');
const projectDialog = document.getElementById('project-dialog');
const projectForm = document.getElementById('project-form');

const PROJECT_STATUS_LABELS = { planned: 'Pianificato', active: 'In corso', completed: 'Completato' };

let projects = [];

async function caricaProgetti() {
    try {
        const status = statusFilter.value;
        const { data } = await api.get('/projects', { params: status ? { status } : {} });
        projects = data.projects;
        renderProgetti();
    } catch (err) {
        projectsEmpty.textContent = getErrorMessage(err);
        projectsEmpty.hidden = false;
    }
}

function renderProgetti() {
    const search = projectSearch.value.trim().toLowerCase();
    const visible = projects.filter((project) => project.title.toLowerCase().includes(search));

    projectsBody.innerHTML = '';
    projectsEmpty.textContent = 'Nessun progetto trovato.';
    projectsEmpty.hidden = visible.length > 0;

    visible.forEach((project) => {
        const row = document.getElementById('project-row-template').content.firstElementChild.cloneNode(true);

        const link = row.querySelector('.project-link');
        link.textContent = project.title;
        link.addEventListener('click', () => localStorage.setItem('currentProject', project._id));

        row.querySelector('.project-goal').textContent = project.goal || '—';
        const status = row.querySelector('.project-status');
        status.textContent = PROJECT_STATUS_LABELS[project.status];
        status.dataset.status = project.status;
        row.querySelector('.project-created').textContent = new Date(project.createdAt).toLocaleDateString('it-IT');

        const isOwner = String(project.owner) === String(currentUser.id);
        const editButton = row.querySelector('.project-edit');
        const deleteButton = row.querySelector('.project-delete');
        editButton.hidden = !isOwner;
        deleteButton.hidden = !isOwner;
        editButton.addEventListener('click', () => apriProjectDialog(project));
        deleteButton.addEventListener('click', () => eliminaProgetto(project));

        projectsBody.appendChild(row);
    });
}

function apriProjectDialog(project) {
    projectForm.reset();
    projectForm.querySelector('.form-error').textContent = '';
    document.getElementById('project-dialog-title').textContent = project ? 'Modifica progetto' : 'Crea progetto';

    projectForm.querySelector('[name="id"]').value = project ? project._id : '';
    if (project) {
        projectForm.querySelector('[name="title"]').value = project.title;
        projectForm.querySelector('[name="description"]').value = project.description || '';
        projectForm.querySelector('[name="goal"]').value = project.goal || '';
        projectForm.querySelector('[name="status"]').value = project.status;
    }
    projectDialog.showModal();
}

async function eliminaProgetto(project) {
    if (!confirm(`Eliminare "${project.title}" e tutte le sue task?`)) return;
    try {
        await api.delete(`/projects/${project._id}`);
        if (localStorage.getItem('currentProject') === project._id) localStorage.removeItem('currentProject');
        await caricaProgetti();
    } catch (err) {
        alert(getErrorMessage(err));
    }
}

projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorElement = projectForm.querySelector('.form-error');
    const button = projectForm.querySelector('button[type="submit"]');
    errorElement.textContent = '';
    button.disabled = true;

    try {
        const { id, ...body } = Object.fromEntries(new FormData(projectForm));
        if (id) await api.patch(`/projects/${id}`, body);
        else await api.post('/projects', body);

        projectDialog.close();
        await caricaProgetti();
    } catch (err) {
        errorElement.textContent = getErrorMessage(err);
    } finally {
        button.disabled = false;
    }
});

document.getElementById('open-project-dialog').addEventListener('click', () => apriProjectDialog(null));
projectSearch.addEventListener('input', renderProgetti);
statusFilter.addEventListener('change', caricaProgetti);

document.addEventListener('click', (event) => {
    const closer = event.target.closest('[data-close]');
    if (closer) closer.closest('dialog').close();
});

caricaProgetti();