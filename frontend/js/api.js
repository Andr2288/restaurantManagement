// js/api.js - Виправлений API клієнт з кращою обробкою помилок

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
     * Базовий метод для HTTP запитів з покращеною обробкою помилок
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

            console.log(`API Request: ${finalOptions.method} ${url}`, finalOptions.body ? JSON.parse(finalOptions.body) : '');

            const response = await fetch(url, finalOptions);

            hideLoading();

            // Спробуємо спочатку отримати JSON
            let data;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error('JSON parse error:', jsonError);
                    throw new Error('Сервер повернув некоректні дані');
                }
            } else {
                // Якщо не JSON, отримуємо текст для діагностики
                const textResponse = await response.text();
                console.error('Non-JSON response:', textResponse);

                if (!response.ok) {
                    if (response.status === 400) {
                        throw new Error('Невірні дані запиту. Перевірте правильність заповнення форми.');
                    } else if (response.status === 401) {
                        throw new Error('Помилка авторизації');
                    } else if (response.status === 404) {
                        throw new Error('Ресурс не знайдено');
                    } else if (response.status === 500) {
                        throw new Error('Внутрішня помилка сервера');
                    } else {
                        throw new Error(`Помилка сервера: ${response.status} ${response.statusText}`);
                    }
                }

                throw new Error('Сервер повернув некоректну відповідь');
            }

            if (!response.ok) {
                console.error('API Error Response:', data);
                throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('API Response:', data);
            return data;

        } catch (error) {
            hideLoading();
            console.error('API Request failed:', error);

            // Покращуємо повідомлення про помилки мережі
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Не вдалося підключитися до сервера. Перевірте підключення до мережі.');
            }

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
     * POST запит з покращеною валідацією
     */
    async post(endpoint, data, requireAuth = true) {
        // Валідуємо дані перед відправкою
        if (!data || typeof data !== 'object') {
            throw new Error('Некоректні дані для відправки');
        }

        // Очищуємо дані від пустих значень
        const cleanData = this.cleanRequestData(data);

        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(cleanData),
            requireAuth
        });
    }

    /**
     * PUT запит
     */
    async put(endpoint, data, requireAuth = true) {
        const cleanData = this.cleanRequestData(data);

        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(cleanData),
            requireAuth
        });
    }

    /**
     * DELETE запит
     */
    async delete(endpoint, requireAuth = true) {
        return this.request(endpoint, { method: 'DELETE', requireAuth });
    }

    /**
     * Очищення даних запиту від пустих значень та валідація
     */
    cleanRequestData(data) {
        const cleaned = {};

        for (const [key, value] of Object.entries(data)) {
            // Пропускаємо null, undefined та порожні рядки
            if (value !== null && value !== undefined && value !== '') {
                // Для чисел перевіряємо, що це дійсно число
                if (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value))) {
                    cleaned[key] = parseFloat(value);
                } else {
                    cleaned[key] = value;
                }
            }
        }

        return cleaned;
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
 * API методи для роботи з резерваціями з покращеною валідацією
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

    // Створити резервацію з валідацією
    async create(reservation) {
        // Валідація обов'язкових полів
        const required = ['customer_name', 'reservation_date', 'reservation_time', 'table_id', 'number_of_guests'];
        for (const field of required) {
            if (!reservation[field]) {
                throw new Error(`Поле "${field}" є обов'язковим`);
            }
        }

        // Валідація дати
        const reservationDate = new Date(reservation.reservation_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (reservationDate <= today) {
            throw new Error('Дата резервації має бути не раніше завтрашнього дня');
        }

        // Валідація кількості гостей
        const guests = parseInt(reservation.number_of_guests);
        if (guests < 1 || guests > 20) {
            throw new Error('Кількість гостей має бути від 1 до 20');
        }

        // Валідація ID столика
        const tableId = parseInt(reservation.table_id);
        if (!tableId || tableId <= 0) {
            throw new Error('Оберіть столик');
        }

        // Підготовка даних для відправки
        const cleanedReservation = {
            customer_name: reservation.customer_name.trim(),
            customer_phone: reservation.customer_phone ? reservation.customer_phone.trim() : null,
            reservation_date: reservation.reservation_date,
            reservation_time: reservation.reservation_time,
            table_id: tableId,
            number_of_guests: guests,
            notes: reservation.notes ? reservation.notes.trim() : ''
        };

        console.log('Відправляємо резервацію:', cleanedReservation);

        return api.post('/reservations', cleanedReservation, false);
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

    // Створити відгук з валідацією
    async create(feedback) {
        // Валідація рейтингу
        if (!feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
            throw new Error('Оцінка має бути від 1 до 5');
        }

        // Підготовка даних
        const cleanedFeedback = {
            customer_name: feedback.customer_name ? feedback.customer_name.trim() : 'Анонім',
            rating: parseInt(feedback.rating),
            comments: feedback.comments ? feedback.comments.trim() : '',
            feedback_date: feedback.feedback_date || new Date().toISOString().split('T')[0]
        };

        return api.post('/feedback', cleanedFeedback, false);
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

/**
 * Перевірка статусу сервера
 */
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Retry механізм для запитів
 */
async function retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFn();
        } catch (error) {
            lastError = error;

            // Не повторюємо для помилок валідації (400)
            if (error.message.includes('400') || error.message.includes('валідації')) {
                throw error;
            }

            if (i < maxRetries - 1) {
                console.log(`Спроба ${i + 1} не вдалася, повторюємо через ${delay}мс...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Експоненційне збільшення затримки
            }
        }
    }

    throw lastError;
}

// Експортуємо API для використання в інших файлах
window.API = {
    Menu: MenuAPI,
    Tables: TablesAPI,
    Reservations: ReservationsAPI,
    Orders: OrdersAPI,
    Employees: EmployeesAPI,
    Feedback: FeedbackAPI,
    testConnection: testApiConnection,
    checkServerStatus: checkServerStatus,
    retryRequest: retryRequest
};

// Автоматична перевірка з'єднання при завантаженні
document.addEventListener('DOMContentLoaded', () => {
    // Перевіряємо з'єднання через 2 секунди після завантаження
    setTimeout(async () => {
        const isConnected = await checkServerStatus();
        if (!isConnected) {
            showAlert('⚠️ Сервер недоступний. Деякі функції можуть не працювати.', 'warning', 8000);
        }
    }, 2000);
});