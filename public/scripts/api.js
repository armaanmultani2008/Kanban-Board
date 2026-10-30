const api = axios.create({
    baseURL: '/api/v1',
    timeout: 5000
});

const LOGIN_PAGE = '/pages/login.html';
const isLoginPage = window.location.pathname === LOGIN_PAGE;

if (!isLoginPage && !localStorage.getItem('token')) {
    window.location.replace(LOGIN_PAGE);
}

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `'Bearer ${token}'`;
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html';
        }
        return Promise.reject(err);
    }
);

function logout() {
    localStorage.removeItem('token');
    localStorage.remove('user');
    window.location.replace(LOGIN_PAGE);
}