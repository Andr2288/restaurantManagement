// js/api.js - Функції для роботи з backend API

// Базова конфігурація API
const API_CONFIG = {
    baseUrl: 'http://localhost:8080',
    timeout: 10000,
    credentials: {
        username: 'admin',
        password: 'restaurant123'
    }
};

/**
 * Базовий клас для роботи з API
 */
class ApiClient {
    constructor() {
        this.baseUrl = API_CONFIG.baseUrl;
    }

    /**
     * Базовий метод для HTTP запитів
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        // Додаємо авторизацію для захищених запитів
        if (options.requireAuth) {
            const auth = btoa(`${API_CONFIG.credentials.username}:${API_CONFIG.credentials.password}`);
            defaultOptions.headers['Authorization'] = `Basic ${auth}`;
        }

        // Об'єднуємо опції
        const finalOptions = { ...defaultOptions, ...options };

        // Видаляємо власні параметри
        delete finalOptions.requireAuth;

        try {
            showLoading();

            const response = await fetch(url, finalOptions);
            const data = await response.json();

            hideLoading();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            hideLoading();
            console.error('API Request failed:', error);
            throw error;
        }
    }

    /**
     * GET запит
     */
    async get(endpoint, requireAuth = false) {
        return this.request(endpoint, { method: 'GET', requireAuth });
    }

    /**
     * POST запит
     */
    async post(endpoint, data, requireAuth = true) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            requireAuth
        });
    }

    /**
     * PUT запит
     */
    async put(endpoint, data, requireAuth = true) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            requireAuth
        });
    }

    /**
     * DELETE запит
     */
    async delete(endpoint, requireAuth = true) {
        return this.request(endpoint, { method: 'DELETE', requireAuth });
    }
}

// Створюємо глобальний екземпляр API клієнта
const api = new ApiClient();

/**
 * API методи для роботи з меню
 */
const MenuAPI = {
    // Отримати всі страви
    async getAll() {
        return api.get('/menu');
    },

    // Отримати доступні страви
    async getAvailable() {
        return api.get('/menu/available');
    },

    // Отримати страви за категорією
    async getByCategory(category) {
        return api.get(`/menu/category/${encodeURIComponent(category)}`);
    },

    // Отримати одну страву
    async getOne(id) {
        return api.get(`/menu/${id}`, true);
    },

    // Створити страву
    async create(menuItem) {
        return api.post('/menu', menuItem);
    },

    // Оновити страву
    async update(id, menuItem) {
        return api.put(`/menu/${id}`, menuItem);
    },

    // Видалити страву
    async delete(id) {
        return api.delete(`/menu/${id}`);
    }
};

/**
 * API методи для роботи зі столиками
 */
const TablesAPI = {
    // Отримати всі столики
    async getAll() {
        return api.get('/tables', true);
    },

    // Отримати доступні столики
    async getAvailable() {
        return api.get('/tables/available');
    },

    // Отримати один столик
    async getOne(id) {
        return api.get(`/tables/${id}`, true);
    },

    // Створити столик
    async create(table) {
        return api.post('/tables', table);
    },

    // Оновити столик
    async update(id, table) {
        return api.put(`/tables/${id}`, table);
    },

    // Видалити столик
    async delete(id) {
        return api.delete(`/tables/${id}`);
    }
};

/**
 * API методи для роботи з резерваціями
 */
const ReservationsAPI = {
    // Отримати всі резервації
    async getAll() {
        return api.get('/reservations', true);
    },

    // Отримати майбутні резервації
    async getUpcoming() {
        return api.get('/reservations/upcoming', true);
    },

    // Отримати резервації за датою
    async getByDate(date) {
        return api.get(`/reservations/date/${date}`, true);
    },

    // Отримати одну резервацію
    async getOne(id) {
        return api.get(`/reservations/${id}`, true);
    },

    // Створити резервацію
    async create(reservation) {
        return api.post('/reservations', reservation, false);
    },

    // Оновити резервацію
    async update(id, reservation) {
        return api.put(`/reservations/${id}`, reservation);
    },

    // Видалити резервацію
    async delete(id) {
        return api.delete(`/reservations/${id}`);
    }
};

/**
 * API методи для роботи із замовленнями
 */
const OrdersAPI = {
    // Отримати всі замовлення
    async getAll() {
        return api.get('/orders', true);
    },

    // Отримати активні замовлення
    async getActive() {
        return api.get('/orders/active', true);
    },

    // Отримати замовлення за датою
    async getByDate(date) {
        return api.get(`/orders/date/${date}`, true);
    },

    // Отримати одне замовлення
    async getOne(id) {
        return api.get(`/orders/${id}`, true);
    },

    // Створити замовлення
    async create(order) {
        return api.post('/orders', order);
    },

    // Оновити замовлення
    async update(id, order) {
        return api.put(`/orders/${id}`, order);
    },

    // Оновити статус замовлення
    async updateStatus(id, status) {
        return api.put(`/orders/${id}/status`, { status });
    },

    // Видалити замовлення
    async delete(id) {
        return api.delete(`/orders/${id}`);
    }
};

/**
 * API методи для роботи з співробітниками
 */
const EmployeesAPI = {
    // Отримати всіх співробітників
    async getAll() {
        return api.get('/employees', true);
    },

    // Отримати одного співробітника
    async getOne(id) {
        return api.get(`/employees/${id}`, true);
    },

    // Створити співробітника
    async create(employee) {
        return api.post('/employees', employee);
    },

    // Оновити співробітника
    async update(id, employee) {
        return api.put(`/employees/${id}`, employee);
    },

    // Видалити співробітника
    async delete(id) {
        return api.delete(`/employees/${id}`);
    }
};

/**
 * API методи для роботи з відгуками
 */
const FeedbackAPI = {
    // Отримати всі відгуки
    async getAll() {
        return api.get('/feedback', true);
    },

    // Отримати опубліковані відгуки
    async getPublished() {
        return api.get('/feedback/published');
    },

    // Отримати статистику відгуків
    async getStats() {
        return api.get('/feedback/stats');
    },

    // Отримати один відгук
    async getOne(id) {
        return api.get(`/feedback/${id}`, true);
    },

    // Створити відгук
    async create(feedback) {
        return api.post('/feedback', feedback, false);
    },

    // Оновити відгук
    async update(id, feedback) {
        return api.put(`/feedback/${id}`, feedback);
    },

    // Змінити статус публікації
    async togglePublished(id) {
        return api.put(`/feedback/${id}/toggle`, {});
    },

    // Видалити відгук
    async delete(id) {
        return api.delete(`/feedback/${id}`);
    }
};

/**
 * Перевірка з'єднання з API
 */
async function testApiConnection() {
    try {
        const response = await api.get('/');
        console.log('✅ З\'єднання з API успішне:', response);
        return true;
    } catch (error) {
        console.error('❌ Помилка з\'єднання з API:', error);
        showAlert('Помилка з\'єднання з сервером. Перевірте, чи запущений backend.', 'danger');
        return false;
    }
}

// Експортуємо API для використання в інших файлах
window.API = {
    Menu: MenuAPI,
    Tables: TablesAPI,
    Reservations: ReservationsAPI,
    Orders: OrdersAPI,
    Employees: EmployeesAPI,
    Feedback: FeedbackAPI,
    testConnection: testApiConnection
};