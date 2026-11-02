if (localStorage.getItem('token')) {
    window.location.replace('../index.html');
}

const tabs = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('.auth-form');

const setError = (form, message) => {
    form.querySelector('.form-error').textContent = message;
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        forms.forEach(form => {
            form.hidden = form.id !== tab.dataset.target;
            setError(form, '');
        });
    });
});

forms.forEach(form => {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        setError(form, '');
        button.disabled = true;

        try {
            const body = Object.fromEntries(new FormData(form));
            const {data} = await api.post(form.dataset.url, body);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.replace('../index.html');
        } catch (err) {
            const message = err.response && err.response.data && err.response.data.msg;
            setError(form, message || 'Impossibile contattare il server');
            button.disabled = false;
        }
    })
})