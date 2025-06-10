// js/admin.js - Покращена логіка для адмін панелі

/**
 * Головний клас для управління адмін панеллю
 */
class RestaurantAdmin {
    constructor() {
        this.currentTab = 'dashboard';
        this.currentEditId = null;
        this.dashboardData = {};
        this.init();
    }

    /**
     * Ініціалізація адмін панелі
     */
    async init() {
        this.setupEventListeners();
        this.setupMobileMenu();
        await this.loadInitialData();
        this.startAutoRefresh();

        // Показуємо дашборд за замовчуванням
        document.querySelector('[data-tab="dashboard"]')?.classList.add('active');
        document.getElementById('dashboard')?.classList.add('active');
    }

    /**
     * Налаштування обробників подій
     */
    setupEventListeners() {
        // Навігація між вкладками
        const tabLinks = document.querySelectorAll('.nav-link[data-tab]');
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Фільтри
        this.setupFilters();

        // Обробка подій форм
        this.setupFormHandlers();

        // Закриття модальних вікон при кліку поза ними
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                hideModal(e.target.id);
            }
        });
    }

    /**
     * Налаштування фільтрів
     */
    setupFilters() {
        // Фільтр меню
        const menuCategoryFilter = document.getElementById('menu-category-filter');
        const menuSearch = document.getElementById('menu-search');

        if (menuCategoryFilter) {
            menuCategoryFilter.addEventListener('change', () => this.filterMenuItems());
        }

        if (menuSearch) {
            menuSearch.addEventListener('input', debounce(() => this.filterMenuItems(), 300));
        }

        // Фільтр замовлень
        const orderStatusFilter = document.getElementById('order-status-filter');
        const orderDateFilter = document.getElementById('order-date-filter');

        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', () => this.filterOrders());
        }

        if (orderDateFilter) {
            orderDateFilter.addEventListener('change', () => this.filterOrders());
        }

        // Фільтр резервацій
        const reservationStatusFilter = document.getElementById('reservation-status-filter');
        const reservationDateFilter = document.getElementById('reservation-date-filter');

        if (reservationStatusFilter) {
            reservationStatusFilter.addEventListener('change', () => this.filterReservations());
        }

        if (reservationDateFilter) {
            reservationDateFilter.addEventListener('change', () => this.filterReservations());
        }

        // Фільтр співробітників
        const employeePositionFilter = document.getElementById('employee-position-filter');
        const employeeSearch = document.getElementById('employee-search');

        if (employeePositionFilter) {
            employeePositionFilter.addEventListener('change', () => this.filterEmployees());
        }

        if (employeeSearch) {
            employeeSearch.addEventListener('input', debounce(() => this.filterEmployees(), 300));
        }

        // Фільтр відгуків
        const feedbackRatingFilter = document.getElementById('feedback-rating-filter');
        const feedbackPublishedFilter = document.getElementById('feedback-published-filter');

        if (feedbackRatingFilter) {
            feedbackRatingFilter.addEventListener('change', () => this.filterFeedback());
        }

        if (feedbackPublishedFilter) {
            feedbackPublishedFilter.addEventListener('change', () => this.filterFeedback());
        }
    }

    /**
     * Налаштування обробників форм
     */
    setupFormHandlers() {
        // Встановлення поточної дати та часу для нових записів
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toTimeString().split(' ')[0].substring(0, 5);

        const orderDate = document.getElementById('order-date');
        const orderTime = document.getElementById('order-time');

        if (orderDate) orderDate.value = today;
        if (orderTime) orderTime.value = now;

        // Встановлення мінімальної дати для резервацій
        const reservationDate = document.getElementById('reservation-date');
        if (reservationDate) {
            reservationDate.min = today;
        }

        // Встановлення поточної дати прийняття на роботу
        const employeeHireDate = document.getElementById('employee-hire-date');
        if (employeeHireDate) {
            employeeHireDate.value = today;
        }
    }

    /**
     * Налаштування мобільного меню
     */
    setupMobileMenu() {
        // Створюємо кнопку мобільного меню
        const navbar = document.querySelector('.navbar .container');
        if (navbar && window.innerWidth <= 480) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'mobile-menu-toggle';
            toggleButton.innerHTML = '☰';

            toggleButton.addEventListener('click', () => {
                const navbarNav = document.querySelector('.navbar-nav');
                if (navbarNav) {
                    navbarNav.classList.toggle('show');
                }
            });

            navbar.appendChild(toggleButton);
        }
    }

    /**
     * Завантаження початкових даних
     */
    async loadInitialData() {
        try {
            showLoading('Завантаження адмін панелі...');

            // Перевіряємо з'єднання з API
            const connectionTest = await API.testConnection();
            if (!connectionTest) {
                throw new Error('Немає з\'єднання з сервером');
            }

            // Завантажуємо дані для поточної вкладки
            await this.loadTabData(this.currentTab);

            hideLoading();
            showAlert('Адмін панель завантажена успішно', 'success', 3000);
        } catch (error) {
            hideLoading();
            console.error('Помилка завантаження:', error);
            showAlert('Помилка завантаження даних: ' + error.message, 'danger');
        }
    }

    /**
     * Перемикання між вкладками
     */
    async switchTab(tabName) {
        if (this.currentTab === tabName) return;

        // Оновлюємо активну вкладку в навігації
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Приховуємо всі секції
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Показуємо поточну секцію
        const targetSection = document.getElementById(tabName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        this.currentTab = tabName;

        // Завантажуємо дані для вкладки
        await this.loadTabData(tabName);

        // Закриваємо мобільне меню
        const navbarNav = document.querySelector('.navbar-nav');
        if (navbarNav && navbarNav.classList.contains('show')) {
            navbarNav.classList.remove('show');
        }
    }

    /**
     * Завантаження даних для вкладки
     */
    async loadTabData(tabName) {
        try {
            switch (tabName) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'menu':
                    await this.loadMenu();
                    break;
                case 'orders':
                    await this.loadOrders();
                    break;
                case 'reservations':
                    await this.loadReservations();
                    break;
                case 'tables':
                    await this.loadTables();
                    break;
                case 'employees':
                    await this.loadEmployees();
                    break;
                case 'feedback':
                    await this.loadFeedback();
                    break;
            }
        } catch (error) {
            console.error(`Помилка завантаження даних для ${tabName}:`, error);
            showAlert(`Помилка завантаження даних: ${error.message}`, 'danger');
        }
    }

    /**
     * Завантаження дашборду
     */
    async loadDashboard() {
        try {
            // Завантажуємо всі необхідні дані паралельно
            const [ordersResponse, reservationsResponse, feedbackResponse] = await Promise.all([
                API.Orders.getAll(),
                API.Reservations.getAll(),
                API.Feedback.getStats()
            ]);

            // Обробляємо дані замовлень
            const orders = ordersResponse.success ? ordersResponse.data : [];
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = orders.filter(order => order.order_date === today);
            const activeOrders = orders.filter(order =>
                ['Нове', 'Готується', 'Готове', 'Подано'].includes(order.status)
            );

            // Обробляємо дані резервацій
            const reservations = reservationsResponse.success ? reservationsResponse.data : [];
            const todayReservations = reservations.filter(reservation =>
                reservation.reservation_date === today
            );

            // Розраховуємо виручку
            const todayRevenue = todayOrders
                .filter(order => order.status === 'Оплачено')
                .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

            // Середня оцінка
            const avgRating = feedbackResponse.success && feedbackResponse.data ?
                parseFloat(feedbackResponse.data.avg_rating || 0) : 0;

            // Оновлюємо статистичні картки
            this.updateDashboardStats({
                orders: todayOrders.length,
                reservations: todayReservations.length,
                revenue: todayRevenue,
                rating: avgRating
            });

            // Відображаємо активні замовлення
            this.renderActiveOrders(activeOrders);

            // Відображаємо сьогоднішні резервації
            this.renderTodayReservations(todayReservations);

        } catch (error) {
            console.error('Помилка завантаження дашборду:', error);
            this.renderDashboardError();
        }
    }

    /**
     * Оновлення статистичних карток
     */
    updateDashboardStats(stats) {
        const statOrders = document.getElementById('stat-orders');
        const statReservations = document.getElementById('stat-reservations');
        const statRevenue = document.getElementById('stat-revenue');
        const statRating = document.getElementById('stat-rating');

        if (statOrders) statOrders.textContent = stats.orders;
        if (statReservations) statReservations.textContent = stats.reservations;
        if (statRevenue) statRevenue.textContent = formatCurrency(stats.revenue);
        if (statRating) statRating.textContent = stats.rating.toFixed(1);
    }

    /**
     * Відображення активних замовлень
     */
    renderActiveOrders(orders) {
        const container = document.getElementById('active-orders');
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Немає активних замовлень</p></div>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-number">Замовлення #${order.id}</div>
                    <div class="order-status status-${this.getStatusClass(order.status)}">
                        ${order.status}
                    </div>
                </div>
                <div class="order-details">
                    <div><strong>Столик:</strong> №${order.table_number || order.table_id}</div>
                    <div><strong>Офіціант:</strong> ${order.employee_name || 'Невідомо'}</div>
                    <div><strong>Час:</strong> ${formatTime(order.order_time)}</div>
                    <div><strong>Сума:</strong> ${formatCurrency(order.total_amount)}</div>
                </div>
                <div class="order-actions">
                    <button class="btn btn-sm btn-primary" onclick="adminApp.viewOrderDetails(${order.id})">
                        Деталі
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="adminApp.updateOrderStatus(${order.id})">
                        Статус
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Відображення сьогоднішніх резервацій
     */
    renderTodayReservations(reservations) {
        const container = document.getElementById('today-reservations');
        if (!container) return;

        if (!reservations || reservations.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Немає резервацій на сьогодні</p></div>';
            return;
        }

        // Сортуємо за часом
        reservations.sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));

        container.innerHTML = reservations.map(reservation => `
            <div class="reservation-item">
                <div class="reservation-info">
                    <div class="reservation-name">${reservation.customer_name}</div>
                    <div class="reservation-details">
                        Столик №${reservation.table_number || reservation.table_id} • 
                        ${reservation.number_of_guests} ${this.pluralize(reservation.number_of_guests, ['гість', 'гості', 'гостей'])}
                        ${reservation.customer_phone ? ` • ${reservation.customer_phone}` : ''}
                    </div>
                </div>
                <div class="reservation-time">
                    <div class="reservation-time-value">${formatTime(reservation.reservation_time)}</div>
                </div>
                <div class="reservation-status status-${this.getReservationStatusClass(reservation.status)}">
                    ${reservation.status}
                </div>
            </div>
        `).join('');
    }

    /**
     * Завантаження меню
     */
    async loadMenu() {
        try {
            const response = await API.Menu.getAll();

            if (response.success && response.data) {
                const menuItems = response.data.items || response.data;
                this.renderMenuTable(menuItems);
            } else {
                throw new Error('Не вдалося завантажити меню');
            }
        } catch (error) {
            console.error('Помилка завантаження меню:', error);
            this.renderMenuError();
        }
    }

    /**
     * Відображення таблиці меню
     */
    renderMenuTable(menuItems) {
        const tbody = document.querySelector('#menu-table tbody');
        if (!tbody) return;

        if (!menuItems || menuItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Немає страв у меню</td></tr>';
            return;
        }

        tbody.innerHTML = menuItems.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${item.cooking_time || 0} хв</td>
                <td>
                    <span class="status-badge status-${item.is_available ? 'available' : 'unavailable'}">
                        ${item.is_available ? 'Доступна' : 'Недоступна'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-edit" onclick="adminApp.editMenuItem(${item.id})" title="Редагувати">
                            ✏️
                        </button>
                        <button class="btn btn-toggle" onclick="adminApp.toggleMenuItemAvailability(${item.id})" title="Змінити доступність">
                            ${item.is_available ? '🚫' : '✅'}
                        </button>
                        <button class="btn btn-delete" onclick="adminApp.deleteMenuItem(${item.id})" title="Видалити">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Завантаження замовлень
     */
    async loadOrders() {
        try {
            const response = await API.Orders.getAll();

            if (response.success && response.data) {
                this.renderOrdersTable(response.data);
            } else {
                throw new Error('Не вдалося завантажити замовлення');
            }
        } catch (error) {
            console.error('Помилка завантаження замовлень:', error);
            this.renderOrdersError();
        }
    }

    /**
     * Відображення таблиці замовлень
     */
    renderOrdersTable(orders) {
        const tbody = document.querySelector('#orders-table tbody');
        if (!tbody) return;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Немає замовлень</td></tr>';
            return;
        }

        // Сортуємо за датою та часом (найновіші спочатку)
        orders.sort((a, b) => {
            const dateA = new Date(`${a.order_date} ${a.order_time}`);
            const dateB = new Date(`${b.order_date} ${b.order_time}`);
            return dateB - dateA;
        });

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>№${order.table_number || order.table_id}</td>
                <td>${order.employee_name || 'Невідомо'}</td>
                <td>
                    ${formatDate(order.order_date)}<br>
                    <small>${formatTime(order.order_time)}</small>
                </td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td>
                    <span class="status-badge status-${this.getStatusClass(order.status)}">
                        ${order.status}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-edit" onclick="adminApp.viewOrderDetails(${order.id})" title="Деталі">
                            👁️
                        </button>
                        <button class="btn btn-toggle" onclick="adminApp.updateOrderStatus(${order.id})" title="Змінити статус">
                            🔄
                        </button>
                        <button class="btn btn-delete" onclick="adminApp.deleteOrder(${order.id})" title="Видалити">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Завантаження резервацій
     */
    async loadReservations() {
        try {
            const response = await API.Reservations.getAll();

            if (response.success && response.data) {
                this.renderReservationsTable(response.data);
            } else {
                throw new Error('Не вдалося завантажити резервації');
            }
        } catch (error) {
            console.error('Помилка завантаження резервацій:', error);
            this.renderReservationsError();
        }
    }

    /**
     * Відображення таблиці резервацій
     */
    renderReservationsTable(reservations) {
        const tbody = document.querySelector('#reservations-table tbody');
        if (!tbody) return;

        if (!reservations || reservations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Немає резервацій</td></tr>';
            return;
        }

        // Сортуємо за датою та часом
        reservations.sort((a, b) => {
            const dateA = new Date(`${a.reservation_date} ${a.reservation_time}`);
            const dateB = new Date(`${b.reservation_date} ${b.reservation_time}`);
            return dateB - dateA;
        });

        tbody.innerHTML = reservations.map(reservation => `
            <tr>
                <td>${reservation.customer_name}</td>
                <td>${reservation.customer_phone || '-'}</td>
                <td>
                    ${formatDate(reservation.reservation_date)}<br>
                    <small>${formatTime(reservation.reservation_time)}</small>
                </td>
                <td>№${reservation.table_number || reservation.table_id}</td>
                <td>${reservation.number_of_guests}</td>
                <td>
                    <span class="status-badge status-${this.getReservationStatusClass(reservation.status)}">
                        ${reservation.status}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-edit" onclick="adminApp.editReservation(${reservation.id})" title="Редагувати">
                            ✏️
                        </button>
                        <button class="btn btn-toggle" onclick="adminApp.updateReservationStatus(${reservation.id})" title="Змінити статус">
                            🔄
                        </button>
                        <button class="btn btn-delete" onclick="adminApp.deleteReservation(${reservation.id})" title="Видалити">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Завантаження столиків
     */
    async loadTables() {
        try {
            const response = await API.Tables.getAll();

            if (response.success && response.data) {
                this.renderTablesTable(response.data);
            } else {
                throw new Error('Не вдалося завантажити столики');
            }
        } catch (error) {
            console.error('Помилка завантаження столиків:', error);
            this.renderTablesError();
        }
    }

    /**
     * Відображення таблиці столиків
     */
    renderTablesTable(tables) {
        const tbody = document.querySelector('#tables-table tbody');
        if (!tbody) return;

        if (!tables || tables.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Немає столиків</td></tr>';
            return;
        }

        // Сортуємо за номером
        tables.sort((a, b) => a.table_number - b.table_number);

        tbody.innerHTML = tables.map(table => `
            <tr>
                <td>№${table.table_number}</td>
                <td>${table.capacity} ${this.pluralize(table.capacity, ['місце', 'місця', 'місць'])}</td>
                <td>${table.location || '-'}</td>
                <td>
                    <span class="status-badge status-${table.is_available ? 'available' : 'unavailable'}">
                        ${table.is_available ? 'Доступний' : 'Недоступний'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-edit" onclick="adminApp.editTable(${table.id})" title="Редагувати">
                            ✏️
                        </button>
                        <button class="btn btn-toggle" onclick="adminApp.toggleTableAvailability(${table.id})" title="Змінити доступність">
                            ${table.is_available ? '🚫' : '✅'}
                        </button>
                        <button class="btn btn-delete" onclick="adminApp.deleteTable(${table.id})" title="Видалити">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Завантаження співробітників
     */
    async loadEmployees() {
        try {
            const response = await API.Employees.getAll();

            if (response.success && response.data) {
                this.renderEmployeesTable(response.data);
            } else {
                throw new Error('Не вдалося завантажити співробітників');
            }
        } catch (error) {
            console.error('Помилка завантаження співробітників:', error);
            this.renderEmployeesError();
        }
    }

    /**
     * Відображення таблиці співробітників
     */
    renderEmployeesTable(employees) {
        const tbody = document.querySelector('#employees-table tbody');
        if (!tbody) return;

        if (!employees || employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Немає співробітників</td></tr>';
            return;
        }

        // Сортуємо за прізвищем
        employees.sort((a, b) => a.last_name.localeCompare(b.last_name, 'uk'));

        tbody.innerHTML = employees.map(employee => `
            <tr>
                <td>${employee.first_name} ${employee.last_name}</td>
                <td>${employee.position}</td>
                <td>${employee.phone || '-'}</td>
                <td>${employee.email || '-'}</td>
                <td>${employee.salary ? formatCurrency(employee.salary) : '-'}</td>
                <td>
                    <span class="status-badge status-${employee.is_active ? 'active' : 'inactive'}">
                        ${employee.is_active ? 'Активний' : 'Неактивний'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-edit" onclick="adminApp.editEmployee(${employee.id})" title="Редагувати">
                            ✏️
                        </button>
                        <button class="btn btn-toggle" onclick="adminApp.toggleEmployeeStatus(${employee.id})" title="Змінити статус">
                            ${employee.is_active ? '🚫' : '✅'}
                        </button>
                        <button class="btn btn-delete" onclick="adminApp.deleteEmployee(${employee.id})" title="Видалити">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Завантаження відгуків
     */
    async loadFeedback() {
        try {
            const [feedbackResponse, statsResponse] = await Promise.all([
                API.Feedback.getAll(),
                API.Feedback.getStats()
            ]);

            if (feedbackResponse.success && feedbackResponse.data) {
                this.renderFeedbackTable(feedbackResponse.data);
            }

            if (statsResponse.success && statsResponse.data) {
                this.updateFeedbackStats(statsResponse.data);
            }
        } catch (error) {
            console.error('Помилка завантаження відгуків:', error);
            this.renderFeedbackError();
        }
    }

    /**
     * Оновлення статистики відгуків
     */
    updateFeedbackStats(stats) {
        const totalElement = document.getElementById('feedback-total');
        const avgElement = document.getElementById('feedback-avg');

        if (totalElement) {
            totalElement.textContent = `${stats.total_count || 0} відгуків`;
        }

        if (avgElement) {
            const avgRating = parseFloat(stats.avg_rating || 0);
            avgElement.textContent = `⭐ ${avgRating.toFixed(1)}`;
        }
    }

    /**
     * Відображення таблиці відгуків
     */
    renderFeedbackTable(feedback) {
        const tbody = document.querySelector('#feedback-table tbody');
        if (!tbody) return;

        if (!feedback || feedback.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Немає відгуків</td></tr>';
            return;
        }

        // Сортуємо за датою (найновіші спочатку)
        feedback.sort((a, b) => new Date(b.feedback_date) - new Date(a.feedback_date));

        tbody.innerHTML = feedback.map(item => `
            <tr>
                <td>${item.customer_name || 'Анонім'}</td>
                <td>${'⭐'.repeat(item.rating)}</td>
                <td>
                    <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                        ${item.comments || '-'}
                    </div>
                </td>
                <td>${formatDate(item.feedback_date)}</td>
                <td>
                    <span class="status-badge status-${item.is_published ? 'published' : 'unpublished'}">
                        ${item.is_published ? 'Опубліковано' : 'Не опубліковано'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-toggle" onclick="adminApp.toggleFeedbackPublished(${item.id})" title="Змінити публікацію">
                            ${item.is_published ? '👁️' : '🚫'}
                        </button>
                        <button class="btn btn-delete" onclick="adminApp.deleteFeedback(${item.id})" title="Видалити">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // === МЕТОДИ ДЛЯ РОБОТИ З МЕНЮ ===

    /**
     * Відкриття модального вікна для додавання/редагування страви
     */
    async editMenuItem(id = null) {
        this.currentEditId = id;

        if (id) {
            try {
                const response = await API.Menu.getOne(id);
                if (response.success && response.data) {
                    setFormData('menu-form', response.data);
                    document.querySelector('#menu-modal .modal-title').textContent = 'Редагувати страву';
                }
            } catch (error) {
                showAlert('Помилка завантаження даних страви: ' + error.message, 'danger');
                return;
            }
        } else {
            clearForm('menu-form');
            document.querySelector('#menu-modal .modal-title').textContent = 'Додати страву';
        }

        showModal('menu-modal');
    }

    /**
     * Збереження страви
     */
    async saveMenuItem() {
        if (!validateForm('menu-form')) {
            showAlert('Будь ласка, заповніть всі обов\'язкові поля', 'warning');
            return;
        }

        try {
            showLoading('Збереження страви...');

            const formData = getFormData('menu-form');
            let response;

            if (this.currentEditId) {
                response = await API.Menu.update(this.currentEditId, formData);
            } else {
                response = await API.Menu.create(formData);
            }

            hideLoading();

            if (response.success) {
                hideModal('menu-modal');
                showAlert('Страву збережено успішно', 'success');
                await this.loadMenu();
            }
        } catch (error) {
            hideLoading();
            showAlert('Помилка збереження: ' + error.message, 'danger');
        }
    }

    /**
     * Перемикання доступності страви
     */
    async toggleMenuItemAvailability(id) {
        try {
            const response = await API.Menu.getOne(id);
            if (response.success && response.data) {
                const newStatus = !response.data.is_available;
                await API.Menu.update(id, { is_available: newStatus });
                showAlert(`Страву ${newStatus ? 'увімкнено' : 'вимкнено'}`, 'success');
                await this.loadMenu();
            }
        } catch (error) {
            showAlert('Помилка зміни статусу: ' + error.message, 'danger');
        }
    }

    /**
     * Видалення страви
     */
    async deleteMenuItem(id) {
        if (!confirm('Ви впевнені, що хочете видалити цю страву?')) {
            return;
        }

        try {
            showLoading('Видалення страви...');

            await API.Menu.delete(id);

            hideLoading();
            showAlert('Страву видалено', 'success');
            await this.loadMenu();
        } catch (error) {
            hideLoading();
            showAlert('Помилка видалення: ' + error.message, 'danger');
        }
    }

    // === МЕТОДИ ДЛЯ РОБОТИ ІЗ ЗАМОВЛЕННЯМИ ===

    /**
     * Відкриття модального вікна для нового замовлення
     */
    async openOrderModal() {
        try {
            // Завантажуємо столики та співробітників
            const [tablesResponse, employeesResponse] = await Promise.all([
                API.Tables.getAvailable(),
                API.Employees.getAll()
            ]);

            // Заповнюємо селекти
            const tableSelect = document.getElementById('order-table');
            const employeeSelect = document.getElementById('order-employee');

            if (tableSelect && tablesResponse.success) {
                tableSelect.innerHTML = '<option value="">Оберіть столик</option>' +
                    tablesResponse.data.map(table =>
                        `<option value="${table.id}">№${table.table_number} (${table.capacity} місць)</option>`
                    ).join('');
            }

            if (employeeSelect && employeesResponse.success) {
                const waiters = employeesResponse.data.filter(emp =>
                    emp.position === 'Офіціант' && emp.is_active
                );
                employeeSelect.innerHTML = '<option value="">Оберіть офіціанта</option>' +
                    waiters.map(emp =>
                        `<option value="${emp.id}">${emp.first_name} ${emp.last_name}</option>`
                    ).join('');
            }

            clearForm('order-form');
            showModal('order-modal');
        } catch (error) {
            showAlert('Помилка підготовки форми: ' + error.message, 'danger');
        }
    }

    /**
     * Збереження замовлення
     */
    async saveOrder() {
        if (!validateForm('order-form')) {
            showAlert('Будь ласка, заповніть всі обов\'язкові поля', 'warning');
            return;
        }

        try {
            showLoading('Створення замовлення...');

            const formData = getFormData('order-form');
            const response = await API.Orders.create(formData);

            hideLoading();

            if (response.success) {
                hideModal('order-modal');
                showAlert('Замовлення створено успішно', 'success');
                await this.loadOrders();
                if (this.currentTab === 'dashboard') {
                    await this.loadDashboard();
                }
            }
        } catch (error) {
            hideLoading();
            showAlert('Помилка створення замовлення: ' + error.message, 'danger');
        }
    }

    /**
     * Перегляд деталей замовлення
     */
    async viewOrderDetails(id) {
        try {
            showLoading('Завантаження деталей...');

            const response = await API.Orders.getOne(id);

            hideLoading();

            if (response.success && response.data) {
                this.showOrderDetailsModal(response.data);
            }
        } catch (error) {
            hideLoading();
            showAlert('Помилка завантаження деталей: ' + error.message, 'danger');
        }
    }

    /**
     * Показ модального вікна з деталями замовлення
     */
    showOrderDetailsModal(order) {
        const detailsHTML = `
            <div class="order-details-modal">
                <h4>Замовлення #${order.id}</h4>
                <div class="order-info">
                    <p><strong>Столик:</strong> №${order.table_number || order.table_id}</p>
                    <p><strong>Офіціант:</strong> ${order.employee_name || 'Невідомо'}</p>
                    <p><strong>Дата:</strong> ${formatDate(order.order_date)}</p>
                    <p><strong>Час:</strong> ${formatTime(order.order_time)}</p>
                    <p><strong>Статус:</strong> ${order.status}</p>
                    <p><strong>Загальна сума:</strong> ${formatCurrency(order.total_amount)}</p>
                </div>
                ${order.details && order.details.length > 0 ? `
                    <h5>Страви:</h5>
                    <div class="order-items">
                        ${order.details.map(item => `
                            <div class="order-item">
                                <span>${item.item_name} x${item.quantity}</span>
                                <span>${formatCurrency(item.subtotal)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>Немає деталей замовлення</p>'}
            </div>
        `;

        showAlert(detailsHTML, 'info', 0);
    }

    /**
     * Оновлення статусу замовлення
     */
    async updateOrderStatus(id) {
        const statuses = [
            'Нове', 'Готується', 'Готове', 'Подано', 'Оплачено', 'Скасовано'
        ];

        const currentStatus = await this.getCurrentOrderStatus(id);
        const newStatus = prompt(
            `Оберіть новий статус:\n${statuses.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
            statuses.indexOf(currentStatus) + 1
        );

        if (newStatus && newStatus >= 1 && newStatus <= statuses.length) {
            try {
                const selectedStatus = statuses[newStatus - 1];
                await API.Orders.updateStatus(id, selectedStatus);
                showAlert('Статус оновлено', 'success');
                await this.loadTabData(this.currentTab);
            } catch (error) {
                showAlert('Помилка оновлення статусу: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Отримання поточного статусу замовлення
     */
    async getCurrentOrderStatus(id) {
        try {
            const response = await API.Orders.getOne(id);
            return response.success ? response.data.status : 'Нове';
        } catch (error) {
            return 'Нове';
        }
    }

    /**
     * Видалення замовлення
     */
    async deleteOrder(id) {
        if (!confirm('Ви впевнені, що хочете видалити це замовлення?')) {
            return;
        }

        try {
            showLoading('Видалення замовлення...');

            await API.Orders.delete(id);

            hideLoading();
            showAlert('Замовлення видалено', 'success');
            await this.loadTabData(this.currentTab);
        } catch (error) {
            hideLoading();
            showAlert('Помилка видалення: ' + error.message, 'danger');
        }
    }

    // === МЕТОДИ ДЛЯ РОБОТИ З РЕЗЕРВАЦІЯМИ ===

    /**
     * Відкриття модального вікна для резервації
     */
    async editReservation(id = null) {
        this.currentEditId = id;

        try {
            // Завантажуємо столики
            const tablesResponse = await API.Tables.getAvailable();

            const tableSelect = document.getElementById('reservation-table');
            if (tableSelect && tablesResponse.success) {
                tableSelect.innerHTML = '<option value="">Оберіть столик</option>' +
                    tablesResponse.data.map(table =>
                        `<option value="${table.id}">№${table.table_number} (${table.capacity} місць)</option>`
                    ).join('');
            }

            if (id) {
                const response = await API.Reservations.getOne(id);
                if (response.success && response.data) {
                    setFormData('reservation-form', response.data);
                    document.querySelector('#reservation-modal .modal-title').textContent = 'Редагувати резервацію';
                }
            } else {
                clearForm('reservation-form');
                document.querySelector('#reservation-modal .modal-title').textContent = 'Нова резервація';
            }

            showModal('reservation-modal');
        } catch (error) {
            showAlert('Помилка підготовки форми: ' + error.message, 'danger');
        }
    }

    /**
     * Збереження резервації
     */
    async saveReservation() {
        if (!validateForm('reservation-form')) {
            showAlert('Будь ласка, заповніть всі обов\'язкові поля', 'warning');
            return;
        }

        try {
            showLoading('Збереження резервації...');

            const formData = getFormData('reservation-form');
            let response;

            if (this.currentEditId) {
                response = await API.Reservations.update(this.currentEditId, formData);
            } else {
                response = await API.Reservations.create(formData);
            }

            hideLoading();

            if (response.success) {
                hideModal('reservation-modal');
                showAlert('Резервацію збережено успішно', 'success');
                await this.loadTabData(this.currentTab);
            }
        } catch (error) {
            hideLoading();
            showAlert('Помилка збереження: ' + error.message, 'danger');
        }
    }

    /**
     * Оновлення статусу резервації
     */
    async updateReservationStatus(id) {
        const statuses = [
            'Підтверджено', 'Прибули', 'Не з\'явились', 'Скасовано'
        ];

        const newStatus = prompt(
            `Оберіть новий статус:\n${statuses.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        );

        if (newStatus && newStatus >= 1 && newStatus <= statuses.length) {
            try {
                const selectedStatus = statuses[newStatus - 1];
                const response = await API.Reservations.getOne(id);
                if (response.success) {
                    const reservation = response.data;
                    reservation.status = selectedStatus;
                    await API.Reservations.update(id, reservation);
                    showAlert('Статус оновлено', 'success');
                    await this.loadTabData(this.currentTab);
                }
            } catch (error) {
                showAlert('Помилка оновлення статусу: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Видалення резервації
     */
    async deleteReservation(id) {
        if (!confirm('Ви впевнені, що хочете видалити цю резервацію?')) {
            return;
        }

        try {
            showLoading('Видалення резервації...');

            await API.Reservations.delete(id);

            hideLoading();
            showAlert('Резервацію видалено', 'success');
            await this.loadTabData(this.currentTab);
        } catch (error) {
            hideLoading();
            showAlert('Помилка видалення: ' + error.message, 'danger');
        }
    }

    // === МЕТОДИ ДЛЯ РОБОТИ ЗІ СТОЛИКАМИ ===

    /**
     * Редагування столика
     */
    async editTable(id = null) {
        this.currentEditId = id;

        if (id) {
            try {
                const response = await API.Tables.getOne(id);
                if (response.success && response.data) {
                    setFormData('table-form', response.data);
                    document.querySelector('#table-modal .modal-title').textContent = 'Редагувати столик';
                }
            } catch (error) {
                showAlert('Помилка завантаження даних столика: ' + error.message, 'danger');
                return;
            }
        } else {
            clearForm('table-form');
            document.querySelector('#table-modal .modal-title').textContent = 'Додати столик';
        }

        showModal('table-modal');
    }

    /**
     * Збереження столика
     */
    async saveTable() {
        if (!validateForm('table-form')) {
            showAlert('Будь ласка, заповніть всі обов\'язкові поля', 'warning');
            return;
        }

        try {
            showLoading('Збереження столика...');

            const formData = getFormData('table-form');
            let response;

            if (this.currentEditId) {
                response = await API.Tables.update(this.currentEditId, formData);
            } else {
                response = await API.Tables.create(formData);
            }

            hideLoading();

            if (response.success) {
                hideModal('table-modal');
                showAlert('Столик збережено успішно', 'success');
                await this.loadTables();
            }
        } catch (error) {
            hideLoading();
            showAlert('Помилка збереження: ' + error.message, 'danger');
        }
    }

    /**
     * Перемикання доступності столика
     */
    async toggleTableAvailability(id) {
        try {
            const response = await API.Tables.getOne(id);
            if (response.success && response.data) {
                const newStatus = !response.data.is_available;
                await API.Tables.update(id, { is_available: newStatus });
                showAlert(`Столик ${newStatus ? 'увімкнено' : 'вимкнено'}`, 'success');
                await this.loadTables();
            }
        } catch (error) {
            showAlert('Помилка зміни статусу: ' + error.message, 'danger');
        }
    }

    /**
     * Видалення столика
     */
    async deleteTable(id) {
        if (!confirm('Ви впевнені, що хочете видалити цей столик?')) {
            return;
        }

        try {
            showLoading('Видалення столика...');

            await API.Tables.delete(id);

            hideLoading();
            showAlert('Столик видалено', 'success');
            await this.loadTables();
        } catch (error) {
            hideLoading();
            showAlert('Помилка видалення: ' + error.message, 'danger');
        }
    }

    // === МЕТОДИ ДЛЯ РОБОТИ ІЗ СПІВРОБІТНИКАМИ ===

    /**
     * Редагування співробітника
     */
    async editEmployee(id = null) {
        this.currentEditId = id;

        if (id) {
            try {
                const response = await API.Employees.getOne(id);
                if (response.success && response.data) {
                    setFormData('employee-form', response.data);
                    document.querySelector('#employee-modal .modal-title').textContent = 'Редагувати співробітника';
                }
            } catch (error) {
                showAlert('Помилка завантаження даних співробітника: ' + error.message, 'danger');
                return;
            }
        } else {
            clearForm('employee-form');
            document.querySelector('#employee-modal .modal-title').textContent = 'Додати співробітника';
        }

        showModal('employee-modal');
    }

    /**
     * Збереження співробітника
     */
    async saveEmployee() {
        if (!validateForm('employee-form')) {
            showAlert('Будь ласка, заповніть всі обов\'язкові поля', 'warning');
            return;
        }

        try {
            showLoading('Збереження співробітника...');

            const formData = getFormData('employee-form');
            let response;

            if (this.currentEditId) {
                response = await API.Employees.update(this.currentEditId, formData);
            } else {
                response = await API.Employees.create(formData);
            }

            hideLoading();

            if (response.success) {
                hideModal('employee-modal');
                showAlert('Співробітника збережено успішно', 'success');
                await this.loadEmployees();
            }
        } catch (error) {
            hideLoading();
            showAlert('Помилка збереження: ' + error.message, 'danger');
        }
    }

    /**
     * Перемикання статусу співробітника
     */
    async toggleEmployeeStatus(id) {
        try {
            const response = await API.Employees.getOne(id);
            if (response.success && response.data) {
                const newStatus = !response.data.is_active;
                await API.Employees.update(id, { is_active: newStatus });
                showAlert(`Співробітника ${newStatus ? 'активовано' : 'деактивовано'}`, 'success');
                await this.loadEmployees();
            }
        } catch (error) {
            showAlert('Помилка зміни статусу: ' + error.message, 'danger');
        }
    }

    /**
     * Видалення співробітника
     */
    async deleteEmployee(id) {
        if (!confirm('Ви впевнені, що хочете видалити цього співробітника?')) {
            return;
        }

        try {
            showLoading('Видалення співробітника...');

            await API.Employees.delete(id);

            hideLoading();
            showAlert('Співробітника видалено', 'success');
            await this.loadEmployees();
        } catch (error) {
            hideLoading();
            showAlert('Помилка видалення: ' + error.message, 'danger');
        }
    }

    // === МЕТОДИ ДЛЯ РОБОТИ З ВІДГУКАМИ ===

    /**
     * Перемикання статусу публікації відгуку
     */
    async toggleFeedbackPublished(id) {
        try {
            await API.Feedback.togglePublished(id);
            showAlert('Статус публікації змінено', 'success');
            await this.loadFeedback();
        } catch (error) {
            showAlert('Помилка зміни статусу: ' + error.message, 'danger');
        }
    }

    /**
     * Видалення відгуку
     */
    async deleteFeedback(id) {
        if (!confirm('Ви впевнені, що хочете видалити цей відгук?')) {
            return;
        }

        try {
            showLoading('Видалення відгуку...');

            await API.Feedback.delete(id);

            hideLoading();
            showAlert('Відгук видалено', 'success');
            await this.loadFeedback();
        } catch (error) {
            hideLoading();
            showAlert('Помилка видалення: ' + error.message, 'danger');
        }
    }

    // === МЕТОДИ ФІЛЬТРАЦІЇ ===

    /**
     * Фільтрація меню
     */
    filterMenuItems() {
        const categoryFilter = document.getElementById('menu-category-filter')?.value || 'all';
        const searchFilter = document.getElementById('menu-search')?.value.toLowerCase() || '';

        const rows = document.querySelectorAll('#menu-table tbody tr');

        rows.forEach(row => {
            const cells = row.children;
            if (cells.length === 1) return; // Порожній рядок

            const name = cells[0].textContent.toLowerCase();
            const category = cells[1].textContent;

            const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
            const matchesSearch = name.includes(searchFilter);

            row.style.display = matchesCategory && matchesSearch ? '' : 'none';
        });
    }

    /**
     * Фільтрація замовлень
     */
    filterOrders() {
        const statusFilter = document.getElementById('order-status-filter')?.value || 'all';
        const dateFilter = document.getElementById('order-date-filter')?.value || '';

        const rows = document.querySelectorAll('#orders-table tbody tr');

        rows.forEach(row => {
            const cells = row.children;
            if (cells.length === 1) return; // Порожній рядок

            const statusElement = cells[5].querySelector('.status-badge');
            const status = statusElement ? statusElement.textContent.trim() : '';
            const dateElement = cells[3].textContent.split('\n')[0].trim();

            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            const matchesDate = !dateFilter || dateElement.includes(formatDate(dateFilter));

            row.style.display = matchesStatus && matchesDate ? '' : 'none';
        });
    }

    /**
     * Фільтрація резервацій
     */
    filterReservations() {
        const statusFilter = document.getElementById('reservation-status-filter')?.value || 'all';
        const dateFilter = document.getElementById('reservation-date-filter')?.value || '';

        const rows = document.querySelectorAll('#reservations-table tbody tr');

        rows.forEach(row => {
            const cells = row.children;
            if (cells.length === 1) return; // Порожній рядок

            const statusElement = cells[5].querySelector('.status-badge');
            const status = statusElement ? statusElement.textContent.trim() : '';
            const dateElement = cells[2].textContent.split('\n')[0].trim();

            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            const matchesDate = !dateFilter || dateElement.includes(formatDate(dateFilter));

            row.style.display = matchesStatus && matchesDate ? '' : 'none';
        });
    }

    /**
     * Фільтрація співробітників
     */
    filterEmployees() {
        const positionFilter = document.getElementById('employee-position-filter')?.value || 'all';
        const searchFilter = document.getElementById('employee-search')?.value.toLowerCase() || '';

        const rows = document.querySelectorAll('#employees-table tbody tr');

        rows.forEach(row => {
            const cells = row.children;
            if (cells.length === 1) return; // Порожній рядок

            const name = cells[0].textContent.toLowerCase();
            const position = cells[1].textContent;

            const matchesPosition = positionFilter === 'all' || position === positionFilter;
            const matchesSearch = name.includes(searchFilter);

            row.style.display = matchesPosition && matchesSearch ? '' : 'none';
        });
    }

    /**
     * Фільтрація відгуків
     */
    filterFeedback() {
        const ratingFilter = document.getElementById('feedback-rating-filter')?.value || 'all';
        const publishedFilter = document.getElementById('feedback-published-filter')?.value || 'all';

        const rows = document.querySelectorAll('#feedback-table tbody tr');

        rows.forEach(row => {
            const cells = row.children;
            if (cells.length === 1) return; // Порожній рядок

            const rating = cells[1].textContent.length; // Кількість зірок
            const statusElement = cells[4].querySelector('.status-badge');
            const isPublished = statusElement ? statusElement.textContent.includes('Опубліковано') : false;

            const matchesRating = ratingFilter === 'all' || rating.toString() === ratingFilter;
            const matchesPublished = publishedFilter === 'all' ||
                (publishedFilter === '1' && isPublished) ||
                (publishedFilter === '0' && !isPublished);

            row.style.display = matchesRating && matchesPublished ? '' : 'none';
        });
    }

    // === ДОПОМІЖНІ МЕТОДИ ===

    /**
     * Отримання CSS класу для статусу
     */
    getStatusClass(status) {
        const statusMap = {
            'Нове': 'new',
            'Готується': 'cooking',
            'Готове': 'ready',
            'Подано': 'served',
            'Оплачено': 'paid',
            'Скасовано': 'cancelled'
        };
        return statusMap[status] || 'new';
    }

    /**
     * Отримання CSS класу для статусу резервації
     */
    getReservationStatusClass(status) {
        const statusMap = {
            'Підтверджено': 'confirmed',
            'Прибули': 'arrived',
            'Не з\'явились': 'noshow',
            'Скасовано': 'cancelled'
        };
        return statusMap[status] || 'confirmed';
    }

    /**
     * Плюралізація українських слів
     */
    pluralize(count, forms) {
        const mod10 = count % 10;
        const mod100 = count % 100;

        if (mod100 >= 11 && mod100 <= 14) {
            return forms[2];
        } else if (mod10 === 1) {
            return forms[0];
        } else if (mod10 >= 2 && mod10 <= 4) {
            return forms[1];
        } else {
            return forms[2];
        }
    }

    /**
     * Автооновлення дашборду
     */
    startAutoRefresh() {
        // Оновлюємо дашборд кожні 30 секунд
        setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadDashboard();
            }
        }, 30000);
    }

    /**
     * Обробка помилок завантаження
     */
    renderDashboardError() {
        const container = document.getElementById('active-orders');
        if (container) {
            container.innerHTML = '<div class="empty-state"><h3>Помилка завантаження</h3></div>';
        }
    }

    renderMenuError() {
        const tbody = document.querySelector('#menu-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Помилка завантаження меню</td></tr>';
        }
    }

    renderOrdersError() {
        const tbody = document.querySelector('#orders-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Помилка завантаження замовлень</td></tr>';
        }
    }

    renderReservationsError() {
        const tbody = document.querySelector('#reservations-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Помилка завантаження резервацій</td></tr>';
        }
    }

    renderTablesError() {
        const tbody = document.querySelector('#tables-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Помилка завантаження столиків</td></tr>';
        }
    }

    renderEmployeesError() {
        const tbody = document.querySelector('#employees-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Помилка завантаження співробітників</td></tr>';
        }
    }

    renderFeedbackError() {
        const tbody = document.querySelector('#feedback-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Помилка завантаження відгуків</td></tr>';
        }
    }
}

// === ГЛОБАЛЬНІ ФУНКЦІЇ ДЛЯ МОДАЛЬНИХ ВІКОН ===

function openMenuModal() {
    adminApp.editMenuItem();
}

function openOrderModal() {
    adminApp.openOrderModal();
}

function openReservationModal() {
    adminApp.editReservation();
}

function openTableModal() {
    adminApp.editTable();
}

function openEmployeeModal() {
    adminApp.editEmployee();
}

function saveMenuItem() {
    adminApp.saveMenuItem();
}

function saveOrder() {
    adminApp.saveOrder();
}

function saveReservation() {
    adminApp.saveReservation();
}

function saveTable() {
    adminApp.saveTable();
}

function saveEmployee() {
    adminApp.saveEmployee();
}

// Ініціалізуємо адмін панель після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new RestaurantAdmin();
});

// Експортуємо клас для глобального використання
window.RestaurantAdmin = RestaurantAdmin;