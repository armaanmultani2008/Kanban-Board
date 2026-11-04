const noTeamSection = document.getElementById('no-team');
const teamSection = document.getElementById('team-view');
const memberList = document.getElementById('member-list');
const memberSearch = document.getElementById('member-search');
const editTeamDialog = document.getElementById('edit-team-dialog');
const editTeamForm = document.getElementById('edit-team-form');

let team = null;
let isAdmin = false;
let members = [];

function ottieniIniziali(name) {
    return (name || '?').split(' ').filter(Boolean).map((word) => word[0]).join('').slice(0, 2).toUpperCase();
}

async function caricaTeam() {
    try {
        const { data: me } = await api.get('/users/me');
        if (!me.user.team) {
            team = null;
            noTeamSection.hidden = false;
            teamSection.hidden = true;
            return;
        }

        const teamId = me.user.team;
        const [teamResponse, membersResponse] = await Promise.all([
            api.get(`/teams/${teamId}`),
            api.get(`/teams/${teamId}/members`),
        ]);

        team = teamResponse.data.team;
        members = membersResponse.data.members;
        isAdmin = team.admin === currentUser.id;

        noTeamSection.hidden = true;
        teamSection.hidden = false;
        renderTeam();
    } catch (err) {
        alert(getErrorMessage(err));
    }
}

function renderTeam() {
    document.getElementById('team-name').textContent = team.name;
    document.getElementById('team-description').textContent = team.description || '';
    document.getElementById('team-goal').textContent = team.goal || '—';
    document.getElementById('invite-code').textContent = team.inviteCode;
    document.getElementById('member-count').textContent = members.length;

    document.getElementById('edit-team-btn').hidden = !isAdmin;
    document.getElementById('delete-team-btn').hidden = !isAdmin;
    document.getElementById('leave-team-btn').hidden = isAdmin; // l'admin non può abbandonare: elimina il team

    renderMembers();
}

function renderMembers() {
    const search = memberSearch.value.trim().toLowerCase();
    const visible = members.filter((member) =>
        `${member.name} ${member.username}`.toLowerCase().includes(search)
    );

    memberList.innerHTML = '';
    visible.forEach((member) => {
        const card = document.getElementById('member-template').content.firstElementChild.cloneNode(true);
        card.querySelector('.member-avatar').textContent = ottieniIniziali(member.name || member.username);
        card.querySelector('.member-name').textContent = member.name;
        card.querySelector('.member-role').textContent = member.job_title || `@${member.username}`;

        const memberIsAdmin = member._id === team.admin;
        card.querySelector('.member-admin').hidden = !memberIsAdmin;

        const removeButton = card.querySelector('.member-remove');
        removeButton.hidden = !(isAdmin && !memberIsAdmin);
        removeButton.addEventListener('click', () => rimuoviMember(member));

        memberList.appendChild(card);
    });
}

async function rimuoviMember(member) {
    if (!confirm(`Rimuovere ${member.name} dal team?`)) return;
    try {
        await api.delete(`/teams/${team._id}/members/${member._id}`);
        await caricaTeam();
    } catch (err) {
        alert(getErrorMessage(err));
    }
}

async function submitForm(form, request) {
    const errorElement = form.querySelector('.form-error');
    errorElement.textContent = '';
    try {
        await request(Object.fromEntries(new FormData(form)));
        return true;
    } catch (err) {
        errorElement.textContent = getErrorMessage(err);
        return false;
    }
}

document.getElementById('create-team-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (await submitForm(event.target, (body) => api.post('/teams', body))) caricaTeam();
});

document.getElementById('join-team-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (await submitForm(event.target, (body) => api.patch('/teams/join', body))) caricaTeam();
});

document.getElementById('edit-team-btn').addEventListener('click', () => {
    editTeamForm.querySelector('[name="name"]').value = team.name;
    editTeamForm.querySelector('[name="description"]').value = team.description || '';
    editTeamForm.querySelector('[name="goal"]').value = team.goal || '';
    editTeamForm.querySelector('.form-error').textContent = '';
    editTeamDialog.showModal();
});

editTeamForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (await submitForm(editTeamForm, (body) => api.patch(`/teams/${team._id}`, body))) {
        editTeamDialog.close();
        caricaTeam();
    }
});

document.getElementById('leave-team-btn').addEventListener('click', async () => {
    if (!confirm('Vuoi abbandonare il team?')) return;
    try {
        await api.delete(`/teams/${team._id}/members/${currentUser.id}`);
        await caricaTeam();
    } catch (err) {
        alert(getErrorMessage(err));
    }
});

document.getElementById('delete-team-btn').addEventListener('click', async () => {
    if (!confirm('Eliminare il team? I membri resteranno senza team.')) return;
    try {
        await api.delete(`/teams/${team._id}`);
        await caricaTeam();
    } catch (err) {
        alert(getErrorMessage(err));
    }
});

document.getElementById('copy-invite-btn').addEventListener('click', async (event) => {
    await navigator.clipboard.writeText(team.inviteCode);
    event.target.textContent = 'Copiato!';
    setTimeout(() => (event.target.textContent = 'Copia'), 1500);
});

memberSearch.addEventListener('input', renderMembers);

document.addEventListener('click', (event) => {
    const closer = event.target.closest('[data-close]');
    if (closer) closer.closest('dialog').close();
});

caricaTeam();