const profileForm = document.getElementById('profile-form');
const darkToggle = document.getElementById('dark-mode-toggle');

async function caricaProfilo() {
    try {
        const { data } = await api.get('/users/me');
        const user = data.user;
        document.getElementById('profile-email').value = user.email;
        profileForm.querySelector('[name="name"]').value = user.name;
        profileForm.querySelector('[name="username"]').value = user.username;
        profileForm.querySelector('[name="job_title"]').value = user.job_title || '';
        profileForm.querySelector('[name="biography"]').value = user.biography || '';
    } catch (err) {
        profileForm.querySelector('.form-error').textContent = getErrorMessage(err);
    }
}

profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorElement = profileForm.querySelector('.form-error');
    const successElement = profileForm.querySelector('.form-success');
    errorElement.textContent = '';
    successElement.textContent = '';

    try {
        const { data } = await api.patch('/users/me', Object.fromEntries(new FormData(profileForm)));
        localStorage.setItem('user', JSON.stringify({ ...currentUser, name: data.user.name, username: data.user.username }));
        successElement.textContent = 'Modifiche salvate';
    } catch (err) {
        errorElement.textContent = getErrorMessage(err);
    }
});

darkToggle.checked = localStorage.getItem('theme') === 'dark';
darkToggle.addEventListener('change', () => {
    const theme = darkToggle.checked ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    document.documentElement.dataset.theme = theme;
});

document.getElementById('logout-btn').addEventListener('click', logout);

caricaProfilo();