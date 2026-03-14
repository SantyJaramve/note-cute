window.API_URL = window.location.origin + '/api';

const Auth = {
  token: localStorage.getItem('noteCuteToken'),
  user: JSON.parse(localStorage.getItem('noteCuteUser') || 'null'),

  isAuthenticated() {
    return !!this.token;
  },

  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('noteCuteToken', data.token);
      localStorage.setItem('noteCuteUser', JSON.stringify(data.user));

      return data;
    } catch (error) {
      throw error;
    }
  },

  async register(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }

      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('noteCuteToken', data.token);
      localStorage.setItem('noteCuteUser', JSON.stringify(data.user));

      return data;
    } catch (error) {
      throw error;
    }
  },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('noteCuteToken');
    localStorage.removeItem('noteCuteUser');
    window.location.href = 'index.html';
  },

  async checkAuth() {
    if (!this.token) return false;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      this.user = data.user;
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  },

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
};

if (typeof window !== 'undefined') {
  const authForm = document.getElementById('authForm');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const errorMessage = document.getElementById('errorMessage');

  if (authForm) {
    let isLoginMode = true;

    const handleSubmit = async (e) => {
      e.preventDefault();
      errorMessage.textContent = '';

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      loginBtn.disabled = true;
      loginBtn.textContent = isLoginMode ? 'Iniciando...' : 'Registrando...';

      try {
        if (isLoginMode) {
          await Auth.login(email, password);
        } else {
          await Auth.register(email, password);
        }
        window.location.href = 'dashboard.html';
      } catch (error) {
        errorMessage.textContent = error.message;
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = isLoginMode ? 'Iniciar Sesión' : 'Registrarse';
      }
    };

    authForm.addEventListener('submit', handleSubmit);

    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        loginBtn.textContent = isLoginMode ? 'Iniciar Sesión' : 'Registrarse';
        registerBtn.textContent = isLoginMode ? 'Registrarse' : 'Iniciar Sesión';
        errorMessage.textContent = '';
      });
    }
  }
};

if (typeof window !== 'undefined') {
window.API_URL = window.location.origin + '/api';
  window.Auth = Auth;
}
