// js/admin.js - Логіка для адміністраторської панелі

/**
 * Головний клас для управління адмін панеллю
 */
class AdminSystem {
    constructor() {
        this.currentTab = 'dashboard';
        this.isLoggedIn = false;
        this.currentData = {};
        this.filters = {};

        this.init();
    }

    /**
     * Ініціалізація системи
     */
    init() {
        this.checkLoginStatus();
        this.setupEventListeners();
    }

    /**
     * Перевірка статусу входу
     */
    checkLoginStatus() {
        const savedAuth = loadFromStorage('admin_auth');
        if (savedAuth && savedAuth.isLoggedIn && savedAuth.remember) {
            this.showAdminPanel();
        } else {
            this.showLoginScreen();
        }
    }

    /**
     * Налаштування обробників подій
     */
    setupEventListeners() {
        // Форма входу
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Кнопка виходу
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Вкладки адмін панелі
        const adminTabs = document.querySelectorAll('.admin-tab');
        adminTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Фільтри
        this.setupFilters();
    }

    /**
     * Налаштування фільтрів
     */
    setupFilters() {
        // Фільтри резервацій
        const reservationsFilters = [
            'reservations-date-filter',
            'reservations-status-filter',
            'reservations-search'
        ];

        reservationsFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', debounce(() => {
                    this.applyReservationsFilters();
                }, 300));

                if (filter.type === 'text') {
                    filter.addEventListener('input', debounce(() => {
                        this.applyReservationsFilters();
                    }, 300));
                }
            }
        });

        // Фільтри замовлень
        const ordersFilters = ['orders-date-filter', 'orders-status-filter'];
        ordersFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', debounce(() => {
                    this.applyOrdersFilters();
                }, 300));
            }
        });

        // Фільтри меню
        const menuFilters = ['menu-category-filter', 'menu-availability-filter', 'menu-search'];
        menuFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                const event = filter.type === 'text' ? 'input' : 'change';
                filter.addEventListener(event, debounce(() => {
                    this.applyMenuFilters();
                }, 300));
            }
        });

        // Фільтри відгуків
        const feedbackFilters = ['feedback-rating-filter', 'feedback-published-filter'];
        feedbackFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', debounce(() => {
                    this.applyFeedbackFilters();
                }, 300));
            }
        });
    }

    /**
     * Обробка входу
     */
    async handleLogin() {
        const formData = getFormData('login-form');

        // Перевірка облікових даних
        if (formData.username === 'admin' && formData.password === 'restaurant123') {
            this.isLoggedIn = true;

            // Збереження статусу входу
            if (formData.remember) {
                saveToStorage('admin_auth', {
                    isLoggedIn: true,
                    remember: true,
                    loginTime: new Date().toISOString()
                });
            }

            showAlert('Вхід успішний! Ласкаво просимо до панелі адміністратора.', 'success');
            this.showAdminPanel();
        } else {
            showAlert('Невірний логін або пароль!', 'danger');
        }
    }

    /**
     * Обробка виходу
     */
    handleLogout() {
        this.isLoggedIn = false;
        removeFromStorage('admin_auth');
        showAlert('Ви успішно вийшли з системи.', 'info');
        this.showLoginScreen();
    }

    /**
     * Показати екран входу
     */
    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
    }

    /**
     * Показати адмін панель
     */
    async showAdminPanel() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';

        // Завантажуємо дані для дашборду
        await this.loadDashboardData();
    }

    /**
     * Перемикання вкладок
     */
    switchTab(tabName) {
        // Оновлюємо активну вкладку
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Показуємо відповідний контент
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Завантажуємо дані для вкладки
        this.loadTabData(tabName);
    }

    /**
     * Завантаження даних для вкладки
     */
    async loadTabData(tabName) {
        try {
            showLoading();

            switch (tabName) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'reservations':
                    await this.loadReservationsData();
                    break;
                case 'orders':
                    await this.loadOrdersData();
                    break;
                case 'menu':
                    await this.loadMenuData();
                    break;
                case 'tables':
                    await this.loadTablesData();
                    break;
                case 'employees':
                    await this.loadEmployeesData();
                    break;
                case 'feedback':
                    await this.loadFeedbackData();
                    break;
            }

            hideLoading();
        } catch (error) {
            hideLoading();
            console.error(`Помилка завантаження даних для ${tabName}:`, error);
            showAlert(`Помилка завантаження даних: ${error.message}`, 'danger');
        }
    }

    /**
     * Завантаження даних дашборду
     */
    async loadDashboardData() {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Завантажуємо всі необхідні дані паралельно
            const [reservationsRes, ordersRes, feedbackRes] = await Promise.all([
                API.Reservations.getByDate(today),
                API.Orders.getByDate(today),
                API.Feedback.getStats()
            ]);

            // Оновлюємо статистичні картки
            this.updateDashboardStats(reservationsRes, ordersRes, feedbackRes);

            // Оновлюємо список активності
            this.updateTodayActivity(reservationsRes, ordersRes);

        } catch (error) {
            console.error('Помилка завантаження дашборду:', error);
        }
    }

    /**
     * Оновлення статистики дашборду
     */
    updateDashboardStats(reservationsRes, ordersRes, feedbackRes) {
        // Резервації сьогодні
        const todayReservations = reservationsRes.success ? reservationsRes.data.length : 0;
        document.getElementById('today-reservations-count').textContent = todayReservations;

        // Активні замовлення
        const activeOrders = ordersRes.success ?
            ordersRes.data.filter(order =>
                ['Нове', 'Готується', 'Готове', 'Подано'].includes(order.status)
            ).length : 0;
        document.getElementById('active-orders-count').textContent = activeOrders;

        // Дохід за сьогодні
        const todayRevenue = ordersRes.success ?
            ordersRes.data
                .filter(order => order.status === 'Оплачено')
                .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) : 0;
        document.getElementById('today-revenue').textContent = formatCurrency(todayRevenue).replace('UAH', '₴');

        // Середня оцінка
        const avgRating = feedbackRes.success ?
            parseFloat(feedbackRes.data.avg_rating || 0).toFixed(1) : '0.0';
        document.getElementById('avg-rating').textContent = avgRating;
    }

    /**
     * Оновлення активності сьогодні
     */
    updateTodayActivity(reservationsRes, ordersRes) {
        const activityContainer = document.getElementById('today-activity');
        const activities = [];

        // Додаємо резервації
        if (reservationsRes.success) {
            reservationsRes.data.forEach(reservation => {
                activities.push({
                    type: 'reservation',
                    icon: '📅',
                    title: `Резервація: ${reservation.customer_name}`,
                    time: formatTime(reservation.reservation_time),
                    timestamp: `${reservation.reservation_date} ${reservation.reservation_time}`
                });
            });
        }

        // Додаємо замовлення
        if (ordersRes.success) {
            ordersRes.data.forEach(order => {
                activities.push({
                    type: 'order',
                    icon: '🍽️',
                    title: `Замовлення #${order.id} - ${order.status}`,
                    time: formatTime(order.order_time),
                    timestamp: `${order.order_date} ${order.order_time}`
                });
            });
        }

        // Сортуємо за часом
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Показуємо тільки останні 10
        const recentActivities = activities.slice(0, 10);

        if (recentActivities.length === 0) {
            activityContainer.innerHTML = `
                <div class="admin-empty-state">
                    <p>Сьогодні поки що немає активності</p>
                </div>
            `;
        } else {
            activityContainer.innerHTML = recentActivities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">${activity.icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * Завантаження даних резервацій
     */
    async loadReservationsData() {
        const response = await API.Reservations.getAll();
        if (response.success) {
            this.currentData.reservations = response.data;
            this.renderReservationsTable(response.data);
        }
    }

    /**
     * Відображення таблиці резервацій
     */
    renderReservationsTable(reservations) {
        const tbody = document.querySelector('#reservations-table tbody');

        if (reservations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="admin-empty-state">
                            <h3>Резервацій немає</h3>
                            <p>Поки що немає жодної резервації</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = reservations.map(reservation => `
            <tr>
                <td>${reservation.id}</td>
                <td>
                    ${formatDate(reservation.reservation_date)}<br>
                    <small>${formatTime(reservation.reservation_time)}</small>
                </td>
                <td>${reservation.customer_name}</td>
                <td>${reservation.customer_phone || '-'}</td>
                <td>№${reservation.table_number || reservation.table_id}</td>
                <td>${reservation.number_of_guests}</td>
                <td>
                    <span class="status-badge status-${reservation.status.toLowerCase().replace(/[^a-z]/g, '')}">
                        ${reservation.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="adminSystem.editReservation(${reservation.id})">
                            Редагувати
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminSystem.deleteReservation(${reservation.id})">
                            Видалити
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Завантаження даних замовлень
     */
    async loadOrdersData() {
        const response = await API.Orders.getAll();
        if (response.success) {
            this.currentData.orders = response.data;
            this.renderOrdersTable(response.data);
        }
    }

    /**
     * Відображення таблиці замовлень
     */
    renderOrdersTable(orders) {
        const tbody = document.querySelector('#orders-table tbody');

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="admin-empty-state">
                            <h3>Замовлень немає</h3>
                            <p>Поки що немає жодного замовлення</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>
                    ${formatDate(order.order_date)}<br>
                    <small>${formatTime(order.order_time)}</small>
                </td>
                <td>№${order.table_number || order.table_id}</td>
                <td>${order.employee_name || 'Не вказано'}</td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td>
                    <span class="status-badge status-${order.status.toLowerCase().replace(/[^a-z]/g, '')}">
                        ${order.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="adminSystem.viewOrder(${order.id})">
                            Деталі
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="adminSystem.editOrder(${order.id})">
                            Редагувати
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminSystem.deleteOrder(${order.id})">
                            Видалити
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Завантаження даних меню
     */
    async loadMenuData() {
        const response = await API.Menu.getAll();
        if (response.success) {
            this.currentData.menu = response.data;
            this.renderMenuTable(response.data);
        }
    }

    /**
     * Відображення таблиці меню
     */
    renderMenuTable(menuItems) {
        const tbody = document.querySelector('#menu-table tbody');

        if (menuItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="admin-empty-state">
                            <h3>Меню порожнє</h3>
                            <p>Додайте першу страву до меню</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = menuItems.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${item.cooking_time || 0} хв</td>
                <td>
                    <span class="status-badge status-${item.is_available ? 'available' : 'unavailable'}">
                        ${item.is_available ? 'Доступно' : 'Недоступно'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="adminSystem.editMenuItem(${item.id})">
                            Редагувати
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminSystem.deleteMenuItem(${item.id})">
                            Видалити
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Завантаження даних столиків
     */
    async loadTablesData() {
        const response = await API.Tables.getAll();
        if (response.success) {
            this.currentData.tables = response.data;
            this.renderTablesTable(response.data);
        }
    }

    /**
     * Відображення таблиці столиків
     */
    renderTablesTable(tables) {
        const tbody = document.querySelector('#tables-table tbody');

        if (tables.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="admin-empty-state">
                            <h3>Столиків немає</h3>
                            <p>Додайте перший столик</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = tables.map(table => `
            <tr>
                <td>${table.id}</td>
                <td>${table.table_number}</td>
                <td>${table.capacity} осіб</td>
                <td>${table.location || 'Не вказано'}</td>
                <td>
                    <span class="status-badge status-${table.is_available ? 'available' : 'unavailable'}">
                        ${table.is_available ? 'Доступний' : 'Недоступний'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="adminSystem.editTable(${table.id})">
                            Редагувати
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminSystem.deleteTable(${table.id})">
                            Видалити
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Завантаження даних співробітників
     */
    async loadEmployeesData() {
        const response = await API.Employees.getAll();
        if (response.success) {
            this.currentData.employees = response.data;
            this.renderEmployeesTable(response.data);
        }
    }

    /**
     * Відображення таблиці співробітників
     */
    renderEmployeesTable(employees) {
        const tbody = document.querySelector('#employees-table tbody');

        if (employees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="admin-empty-state">
                            <h3>Співробітників немає</h3>
                            <p>Додайте першого співробітника</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = employees.map(employee => `
            <tr>
                <td>${employee.id}</td>
                <td>${employee.first_name} ${employee.last_name}</td>
                <td>${employee.position}</td>
                <td>${employee.phone || '-'}</td>
                <td>${employee.email || '-'}</td>
                <td>${formatCurrency(employee.salary)}</td>
                <td>
                    <span class="status-badge status-${employee.is_active ? 'active' : 'inactive'}">
                        ${employee.is_active ? 'Активний' : 'Неактивний'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="adminSystem.editEmployee(${employee.id})">
                            Редагувати
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminSystem.deleteEmployee(${employee.id})">
                            Видалити
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Завантаження даних відгуків
     */
    async loadFeedbackData() {
        const response = await API.Feedback.getAll();
        if (response.success) {
            this.currentData.feedback = response.data;
            this.renderFeedbackTable(response.data);
        }
    }

    /**
     * Відображення таблиці відгуків
     */
    renderFeedbackTable(feedbacks) {
        const tbody = document.querySelector('#feedback-table tbody');

        if (feedbacks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="admin-empty-state">
                            <h3>Відгуків немає</h3>
                            <p>Поки що немає жодного відгуку</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = feedbacks.map(feedback => `
            <tr>
                <td>${feedback.id}</td>
                <td>${feedback.customer_name || 'Анонім'}</td>
                <td>
                    <span class="table-rating">${'⭐'.repeat(feedback.rating)}</span>
                </td>
                <td>
                    <div class="table-comment" title="${feedback.comments || ''}">
                        ${feedback.comments || 'Без коментаря'}
                    </div>
                </td>
                <td>${formatDate(feedback.feedback_date)}</td>
                <td>
                    <span class="status-badge status-${feedback.is_published ? 'published' : 'unpublished'}">
                        ${feedback.is_published ? 'Опубліковано' : 'Не опубліковано'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-${feedback.is_published ? 'warning' : 'success'}" 
                                onclick="adminSystem.toggleFeedbackPublication(${feedback.id})">
                            ${feedback.is_published ? 'Приховати' : 'Опублікувати'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminSystem.deleteFeedback(${feedback.id})">
                            Видалити
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Застосування фільтрів резервацій
     */
    applyReservationsFilters() {
        if (!this.currentData.reservations) return;

        const dateFilter = document.getElementById('reservations-date-filter').value;
        const statusFilter = document.getElementById('reservations-status-filter').value;
        const searchFilter = document.getElementById('reservations-search').value.toLowerCase();

        let filteredData = this.currentData.reservations.filter(reservation => {
            const matchesDate = !dateFilter || reservation.reservation_date === dateFilter;
            const matchesStatus = !statusFilter || reservation.status === statusFilter;
            const matchesSearch = !searchFilter ||
                reservation.customer_name.toLowerCase().includes(searchFilter) ||
                (reservation.customer_phone && reservation.customer_phone.includes(searchFilter));

            return matchesDate && matchesStatus && matchesSearch;
        });

        this.renderReservationsTable(filteredData);
    }

    /**
     * Застосування фільтрів замовлень
     */
    applyOrdersFilters() {
        if (!this.currentData.orders) return;

        const dateFilter = document.getElementById('orders-date-filter').value;
        const statusFilter = document.getElementById('orders-status-filter').value;

        let filteredData = this.currentData.orders.filter(order => {
            const matchesDate = !dateFilter || order.order_date === dateFilter;
            const matchesStatus = !statusFilter || order.status === statusFilter;

            return matchesDate && matchesStatus;
        });

        this.renderOrdersTable(filteredData);
    }

    /**
     * Застосування фільтрів меню
     */
    applyMenuFilters() {
        if (!this.currentData.menu) return;

        const categoryFilter = document.getElementById('menu-category-filter').value;
        const availabilityFilter = document.getElementById('menu-availability-filter').value;
        const searchFilter = document.getElementById('menu-search').value.toLowerCase();

        let filteredData = this.currentData.menu.filter(item => {
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            const matchesAvailability = availabilityFilter === '' ||
                (availabilityFilter === '1' && item.is_available) ||
                (availabilityFilter === '0' && !item.is_available);
            const matchesSearch = !searchFilter ||
                item.name.toLowerCase().includes(searchFilter);

            return matchesCategory && matchesAvailability && matchesSearch;
        });

        this.renderMenuTable(filteredData);
    }

    /**
     * Застосування фільтрів відгуків
     */
    applyFeedbackFilters() {
        if (!this.currentData.feedback) return;

        const ratingFilter = document.getElementById('feedback-rating-filter').value;
        const publishedFilter = document.getElementById('feedback-published-filter').value;

        let filteredData = this.currentData.feedback.filter(feedback => {
            const matchesRating = !ratingFilter || feedback.rating == ratingFilter;
            const matchesPublished = publishedFilter === '' ||
                (publishedFilter === '1' && feedback.is_published) ||
                (publishedFilter === '0' && !feedback.is_published);

            return matchesRating && matchesPublished;
        });

        this.renderFeedbackTable(filteredData);
    }

    /**
     * Модальні вікна та дії
     */

    showCreateReservationModal() {
        showAlert('Функціонал створення резервації буде доданий в наступних версіях', 'info');
    }

    showCreateOrderModal() {
        showAlert('Функціонал створення замовлення буде доданий в наступних версіях', 'info');
    }

    showCreateMenuItemModal() {
        showAlert('Функціонал додавання страв буде доданий в наступних версіях', 'info');
    }

    showCreateTableModal() {
        showAlert('Функціонал додавання столиків буде доданий в наступних версіях', 'info');
    }

    showCreateEmployeeModal() {
        showAlert('Функціонал додавання співробітників буде доданий в наступних версіях', 'info');
    }

    /**
     * Дії з резерваціями
     */
    editReservation(id) {
        showAlert(`Редагування резервації #${id} буде доданий в наступних версіях`, 'info');
    }

    async deleteReservation(id) {
        if (confirm('Ви впевнені, що хочете видалити цю резервацію?')) {
            try {
                await API.Reservations.delete(id);
                showAlert('Резервацію успішно видалено', 'success');
                await this.loadReservationsData();
            } catch (error) {
                showAlert('Помилка видалення резервації: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Дії з замовленнями
     */
    viewOrder(id) {
        showAlert(`Перегляд деталей замовлення #${id} буде доданий в наступних версіях`, 'info');
    }

    editOrder(id) {
        showAlert(`Редагування замовлення #${id} буде доданий в наступних версіях`, 'info');
    }

    async deleteOrder(id) {
        if (confirm('Ви впевнені, що хочете видалити це замовлення?')) {
            try {
                await API.Orders.delete(id);
                showAlert('Замовлення успішно видалено', 'success');
                await this.loadOrdersData();
            } catch (error) {
                showAlert('Помилка видалення замовлення: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Дії з меню
     */
    editMenuItem(id) {
        showAlert(`Редагування страви #${id} буде доданий в наступних версіях`, 'info');
    }

    async deleteMenuItem(id) {
        if (confirm('Ви впевнені, що хочете видалити цю страву з меню?')) {
            try {
                await API.Menu.delete(id);
                showAlert('Страву успішно видалено з меню', 'success');
                await this.loadMenuData();
            } catch (error) {
                showAlert('Помилка видалення страви: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Дії зі столиками
     */
    editTable(id) {
        showAlert(`Редагування столика #${id} буде доданий в наступних версіях`, 'info');
    }

    async deleteTable(id) {
        if (confirm('Ви впевнені, що хочете видалити цей столик?')) {
            try {
                await API.Tables.delete(id);
                showAlert('Столик успішно видалено', 'success');
                await this.loadTablesData();
            } catch (error) {
                showAlert('Помилка видалення столика: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Дії зі співробітниками
     */
    editEmployee(id) {
        showAlert(`Редагування співробітника #${id} буде доданий в наступних версіях`, 'info');
    }

    async deleteEmployee(id) {
        if (confirm('Ви впевнені, що хочете видалити цього співробітника?')) {
            try {
                await API.Employees.delete(id);
                showAlert('Співробітника успішно видалено', 'success');
                await this.loadEmployeesData();
            } catch (error) {
                showAlert('Помилка видалення співробітника: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Дії з відгуками
     */
    async toggleFeedbackPublication(id) {
        try {
            await API.Feedback.togglePublished(id);
            showAlert('Статус публікації відгуку змінено', 'success');
            await this.loadFeedbackData();
        } catch (error) {
            showAlert('Помилка зміни статусу публікації: ' + error.message, 'danger');
        }
    }

    async deleteFeedback(id) {
        if (confirm('Ви впевнені, що хочете видалити цей відгук?')) {
            try {
                await API.Feedback.delete(id);
                showAlert('Відгук успішно видалено', 'success');
                await this.loadFeedbackData();
            } catch (error) {
                showAlert('Помилка видалення відгуку: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Масові дії з відгуками
     */
    async publishAllFeedback() {
        if (confirm('Опублікувати всі неопубліковані відгуки?')) {
            try {
                const unpublishedFeedbacks = this.currentData.feedback.filter(f => !f.is_published);

                for (const feedback of unpublishedFeedbacks) {
                    await API.Feedback.togglePublished(feedback.id);
                }

                showAlert(`Опубліковано ${unpublishedFeedbacks.length} відгуків`, 'success');
                await this.loadFeedbackData();
            } catch (error) {
                showAlert('Помилка публікації відгуків: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Експорт відгуків
     */
    exportFeedback() {
        if (!this.currentData.feedback || this.currentData.feedback.length === 0) {
            showAlert('Немає відгуків для експорту', 'warning');
            return;
        }

        const exportData = this.currentData.feedback.map(feedback => ({
            'ID': feedback.id,
            'Клієнт': feedback.customer_name || 'Анонім',
            'Рейтинг': feedback.rating,
            'Коментар': feedback.comments || '',
            'Дата': feedback.feedback_date,
            'Опубліковано': feedback.is_published ? 'Так' : 'Ні'
        }));

        const filename = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(exportData, filename);
    }
}

// Ініціалізуємо адмін систему після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    window.adminSystem = new AdminSystem();
});

// Експортуємо клас для глобального використання
window.AdminSystem = AdminSystem;