// js/client.js - Логіка для клієнтської частини

/**
 * Головний клас для управління клієнтською частиною
 */
class RestaurantClient {
    constructor() {
        this.currentMenuCategory = 'all';
        this.selectedRating = 0;
        this.init();
    }

    /**
     * Ініціалізація
     */
    async init() {
        this.setupEventListeners();
        this.setupSmoothScrolling();
        this.setupDateRestrictions();
        await this.loadInitialData();
    }

    /**
     * Налаштування обробників подій
     */
    setupEventListeners() {
        // Фільтри меню
        const menuFilters = document.querySelectorAll('.menu-filters .btn');
        menuFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterMenu(e.target.dataset.category);
                this.updateActiveFilter(e.target);
            });
        });

        // Форма резервації
        const reservationForm = document.getElementById('reservation-form');
        if (reservationForm) {
            reservationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReservationSubmit();
            });

            // Динамічне оновлення доступних столиків
            const dateInput = document.getElementById('reservation_date');
            const timeInput = document.getElementById('reservation_time');
            const guestsInput = document.getElementById('number_of_guests');

            [dateInput, timeInput, guestsInput].forEach(input => {
                if (input) {
                    input.addEventListener('change', () => {
                        this.updateAvailableTables();
                    });
                }
            });
        }

        // Рейтинг зірок
        const stars = document.querySelectorAll('.rating-stars .star');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                this.setRating(parseInt(e.target.dataset.rating));
            });

            star.addEventListener('mouseenter', (e) => {
                this.highlightStars(parseInt(e.target.dataset.rating));
            });
        });

        const ratingContainer = document.querySelector('.rating-stars');
        if (ratingContainer) {
            ratingContainer.addEventListener('mouseleave', () => {
                this.highlightStars(this.selectedRating);
            });
        }

        // Форма відгуку
        const feedbackForm = document.getElementById('feedback-form');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFeedbackSubmit();
            });
        }

        // Мобільне меню
        this.setupMobileMenu();
    }

    /**
     * Налаштування плавної прокрутки
     */
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Налаштування обмежень дати
     */
    setupDateRestrictions() {
        const dateInput = document.getElementById('reservation_date');
        if (dateInput) {
            // Мінімальна дата - завтра
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.min = tomorrow.toISOString().split('T')[0];

            // Максимальна дата - через 3 місяці
            const maxDate = new Date();
            maxDate.setMonth(maxDate.getMonth() + 3);
            dateInput.max = maxDate.toISOString().split('T')[0];
        }
    }

    /**
     * Завантаження початкових даних
     */
    async loadInitialData() {
        try {
            showLoading();

            // Завантажуємо меню
            await this.loadMenu();

            // Завантажуємо столики
            await this.loadTables();

            // Завантажуємо відгуки
            await this.loadFeedback();

            // Завантажуємо статистику
            await this.loadFeedbackStats();

            hideLoading();
        } catch (error) {
            hideLoading();
            console.error('Помилка завантаження даних:', error);
            showAlert('Помилка завантаження даних. Перевірте з\'єднання з сервером.', 'danger');
        }
    }

    /**
     * Завантаження меню
     */
    async loadMenu() {
        try {
            const response = await API.Menu.getAvailable();

            if (response.success) {
                this.renderMenu(response.data);
            }
        } catch (error) {
            console.error('Помилка завантаження меню:', error);
            this.renderMenuError();
        }
    }

    /**
     * Відображення меню
     */
    renderMenu(menuItems) {
        const container = document.getElementById('menu-container');
        if (!container) return;

        if (!menuItems || menuItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state col-12">
                    <h3>Меню тимчасово недоступне</h3>
                    <p>Вибачте за незручності. Спробуйте пізніше.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = menuItems.map(item => `
            <div class="menu-item fade-in" data-category="${item.category}">
                <div class="menu-item-category">${item.category}</div>
                <div class="menu-item-header">
                    <h3 class="menu-item-name">${item.name}</h3>
                    <div class="menu-item-price">${formatCurrency(item.price)}</div>
                </div>
                <div class="menu-item-description">${item.description || ''}</div>
                <div class="menu-item-footer">
                    <div class="menu-item-time">${item.cooking_time || 0} хв</div>
                    <div class="menu-item-${item.is_available ? 'available' : 'unavailable'}">
                        ${item.is_available ? '✅ Доступно' : '❌ Недоступно'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Відображення помилки меню
     */
    renderMenuError() {
        const container = document.getElementById('menu-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state col-12">
                    <h3>Помилка завантаження меню</h3>
                    <p>Не вдалося завантажити меню. Спробуйте оновити сторінку.</p>
                    <button class="btn btn-primary" onclick="location.reload()">Оновити</button>
                </div>
            `;
        }
    }

    /**
     * Фільтрування меню за категорією
     */
    filterMenu(category) {
        this.currentMenuCategory = category;
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach(item => {
            const itemCategory = item.dataset.category;
            const shouldShow = category === 'all' || itemCategory === category;

            if (shouldShow) {
                item.style.display = 'block';
                item.classList.add('fade-in');
            } else {
                item.style.display = 'none';
                item.classList.remove('fade-in');
            }
        });
    }

    /**
     * Оновлення активного фільтра
     */
    updateActiveFilter(activeButton) {
        document.querySelectorAll('.menu-filters .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    /**
     * Завантаження столиків
     */
    async loadTables() {
        try {
            const response = await API.Tables.getAvailable();

            if (response.success) {
                this.renderTableOptions(response.data);
            }
        } catch (error) {
            console.error('Помилка завантаження столиків:', error);
        }
    }

    /**
     * Відображення опцій столиків
     */
    renderTableOptions(tables) {
        const select = document.getElementById('table_id');
        if (!select) return;

        // Очищуємо попередні опції (крім першої)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table.id;
            option.textContent = `Столик №${table.table_number} (${table.capacity} місць) - ${table.location}`;
            select.appendChild(option);
        });
    }

    /**
     * Оновлення доступних столиків
     */
    async updateAvailableTables() {
        const date = document.getElementById('reservation_date').value;
        const time = document.getElementById('reservation_time').value;
        const guests = document.getElementById('number_of_guests').value;

        if (!date || !time || !guests) return;

        try {
            const response = await API.Tables.getAvailable();

            if (response.success) {
                // Фільтруємо столики за місткістю
                const suitableTables = response.data.filter(table =>
                    table.capacity >= parseInt(guests)
                );

                this.renderTableOptions(suitableTables);
            }
        } catch (error) {
            console.error('Помилка оновлення столиків:', error);
        }
    }

    /**
     * Обробка подання форми резервації
     */
    async handleReservationSubmit() {
        if (!validateForm('reservation-form')) {
            showAlert('Будь ласка, заповніть всі обов\'язкові поля', 'warning');
            return;
        }

        try {
            showLoading();

            const formData = getFormData('reservation-form');
            const response = await API.Reservations.create(formData);

            hideLoading();

            if (response.success) {
                showAlert('Резервацію успішно створено! Ми зв\'яжемося з вами для підтвердження.', 'success');
                clearForm('reservation-form');

                // Скролимо до верху форми
                document.getElementById('reservation').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            hideLoading();
            console.error('Помилка створення резервації:', error);
            showAlert('Помилка створення резервації: ' + error.message, 'danger');
        }
    }

    /**
     * Встановлення рейтингу
     */
    setRating(rating) {
        this.selectedRating = rating;
        document.getElementById('rating').value = rating;
        this.highlightStars(rating);
    }

    /**
     * Підсвічування зірок
     */
    highlightStars(rating) {
        const stars = document.querySelectorAll('.rating-stars .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    /**
     * Обробка подання відгуку
     */
    async handleFeedbackSubmit() {
        if (!this.selectedRating) {
            showAlert('Будь ласка, оберіть оцінку', 'warning');
            return;
        }

        try {
            showLoading();

            const formData = getFormData('feedback-form');
            formData.rating = this.selectedRating;

            const response = await API.Feedback.create(formData);

            hideLoading();

            if (response.success) {
                showAlert('Дякуємо за ваш відгук!', 'success');
                clearForm('feedback-form');
                this.setRating(0);

                // Перезавантажуємо відгуки
                await this.loadFeedback();
                await this.loadFeedbackStats();
            }
        } catch (error) {
            hideLoading();
            console.error('Помилка відправки відгуку:', error);
            showAlert('Помилка відправки відгуку: ' + error.message, 'danger');
        }
    }

    /**
     * Завантаження відгуків
     */
    async loadFeedback() {
        try {
            const response = await API.Feedback.getPublished();

            if (response.success) {
                this.renderFeedback(response.data);
            }
        } catch (error) {
            console.error('Помилка завантаження відгуків:', error);
            this.renderFeedbackError();
        }
    }

    /**
     * Відображення відгуків
     */
    renderFeedback(feedbacks) {
        const container = document.getElementById('feedback-container');
        if (!container) return;

        if (!feedbacks || feedbacks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Поки що немає відгуків</h3>
                    <p>Будьте першим, хто залишить відгук!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = feedbacks.map(feedback => `
            <div class="feedback-item fade-in">
                <div class="feedback-header">
                    <div class="feedback-author">${feedback.customer_name || 'Анонім'}</div>
                    <div class="feedback-date">${formatDate(feedback.feedback_date)}</div>
                </div>
                <div class="feedback-rating">
                    <div class="stars">${'⭐'.repeat(feedback.rating)}</div>
                </div>
                ${feedback.comments ? `
                    <div class="feedback-comments">"${feedback.comments}"</div>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * Відображення помилки відгуків
     */
    renderFeedbackError() {
        const container = document.getElementById('feedback-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Помилка завантаження відгуків</h3>
                    <p>Не вдалося завантажити відгуки.</p>
                </div>
            `;
        }
    }

    /**
     * Завантаження статистики відгуків
     */
    async loadFeedbackStats() {
        try {
            const response = await API.Feedback.getStats();

            if (response.success) {
                this.renderFeedbackStats(response.data);
            }
        } catch (error) {
            console.error('Помилка завантаження статистики:', error);
        }
    }

    /**
     * Відображення статистики відгуків
     */
    renderFeedbackStats(stats) {
        const container = document.getElementById('feedback-stats');
        if (!container || !stats) return;

        const avgRating = parseFloat(stats.avg_rating) || 0;
        const totalCount = parseInt(stats.total_count) || 0;

        container.innerHTML = `
            <div class="avg-rating">
                <div class="avg-rating-value">${avgRating.toFixed(1)}</div>
                <div class="avg-rating-stars">${'⭐'.repeat(Math.round(avgRating))}</div>
                <div class="text-muted">Середня оцінка</div>
            </div>
            
            <div class="stats-item">
                <div class="stats-label">
                    <span>Всього відгуків:</span>
                </div>
                <div class="stats-value">${totalCount}</div>
            </div>
            
            <div class="stats-item">
                <div class="stats-label">
                    <span>⭐⭐⭐⭐⭐</span>
                </div>
                <div class="stats-value">${stats.rating_5 || 0}</div>
            </div>
            
            <div class="stats-item">
                <div class="stats-label">
                    <span>⭐⭐⭐⭐</span>
                </div>
                <div class="stats-value">${stats.rating_4 || 0}</div>
            </div>
            
            <div class="stats-item">
                <div class="stats-label">
                    <span>⭐⭐⭐</span>
                </div>
                <div class="stats-value">${stats.rating_3 || 0}</div>
            </div>
            
            <div class="stats-item">
                <div class="stats-label">
                    <span>⭐⭐</span>
                </div>
                <div class="stats-value">${stats.rating_2 || 0}</div>
            </div>
            
            <div class="stats-item">
                <div class="stats-label">
                    <span>⭐</span>
                </div>
                <div class="stats-value">${stats.rating_1 || 0}</div>
            </div>
        `;
    }

    /**
     * Налаштування мобільного меню
     */
    setupMobileMenu() {
        // Додаємо кнопку мобільного меню якщо її немає
        const navbar = document.querySelector('.navbar .container > div');
        if (navbar && !document.querySelector('.navbar-toggle')) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'navbar-toggle';
            toggleButton.innerHTML = '☰';
            toggleButton.addEventListener('click', this.toggleMobileMenu);

            navbar.appendChild(toggleButton);
        }
    }

    /**
     * Перемикання мобільного меню
     */
    toggleMobileMenu() {
        const navbarNav = document.querySelector('.navbar-nav');
        if (navbarNav) {
            navbarNav.classList.toggle('show');
        }
    }
}

// Ініціалізуємо клієнт після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    new RestaurantClient();
});

// Експортуємо клас для глобального використання
window.RestaurantClient = RestaurantClient;