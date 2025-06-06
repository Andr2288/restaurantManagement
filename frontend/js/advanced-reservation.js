// js/advanced-reservation.js - Логіка для розширеної резервації

/**
 * Клас для управління розширеною резервацією
 */
class AdvancedReservationSystem {
    constructor() {
        this.calendar = null;
        this.selectedTable = null;
        this.guestCount = 2;
        this.tablesData = [];

        this.init();
    }

    /**
     * Ініціалізація системи
     */
    async init() {
        // Ініціалізуємо календар
        this.calendar = new ReservationCalendar();

        // Налаштовуємо обробники подій
        this.setupEventListeners();

        // Завантажуємо початкові дані
        await this.loadInitialData();

        // Ініціалізуємо схему ресторану
        this.initRestaurantLayout();
    }

    /**
     * Налаштування обробників подій
     */
    setupEventListeners() {
        // Селектор кількості гостей
        this.setupGuestsSelector();

        // Форма резервації
        this.setupReservationForm();

        // Слухаємо події календаря
        document.addEventListener('dateSelected', (e) => {
            this.onDateSelected(e.detail);
        });

        document.addEventListener('timeSelected', (e) => {
            this.onTimeSelected(e.detail);
        });
    }

    /**
     * Налаштування селектора гостей
     */
    setupGuestsSelector() {
        const guestsInput = document.getElementById('adv_guests');
        const minusBtn = document.getElementById('guests-minus');
        const plusBtn = document.getElementById('guests-plus');

        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                if (this.guestCount > 1) {
                    this.guestCount--;
                    guestsInput.value = this.guestCount;
                    this.updateAvailableTables();
                }
            });
        }

        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                if (this.guestCount < 8) {
                    this.guestCount++;
                    guestsInput.value = this.guestCount;
                    this.updateAvailableTables();
                }
            });
        }

        if (guestsInput) {
            guestsInput.addEventListener('change', () => {
                const value = parseInt(guestsInput.value);
                if (value >= 1 && value <= 8) {
                    this.guestCount = value;
                    this.updateAvailableTables();
                }
            });
        }
    }

    /**
     * Налаштування форми резервації
     */
    setupReservationForm() {
        const form = document.getElementById('advanced-reservation-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReservationSubmit();
            });
        }
    }

    /**
     * Завантаження початкових даних
     */
    async loadInitialData() {
        try {
            // Завантажуємо столики
            await this.loadTables();

            // Завантажуємо сьогоднішні резервації
            await this.loadTodayReservations();

        } catch (error) {
            console.error('Помилка завантаження початкових даних:', error);
            showAlert('Помилка завантаження даних', 'danger');
        }
    }

    /**
     * Завантаження столиків
     */
    async loadTables() {
        try {
            const response = await API.Tables.getAll();
            if (response.success) {
                this.tablesData = response.data;
            }
        } catch (error) {
            console.error('Помилка завантаження столиків:', error);
        }
    }

    /**
     * Ініціалізація схеми ресторану
     */
    initRestaurantLayout() {
        this.renderRestaurantLayout();

        // Експортуємо для використання календарем
        window.restaurantLayout = {
            loadTables: () => this.updateTableAvailability()
        };
    }

    /**
     * Відображення схеми ресторану
     */
    renderRestaurantLayout() {
        const layoutContainer = document.getElementById('restaurant-layout');
        if (!layoutContainer) return;

        // Очищуємо контейнер
        layoutContainer.innerHTML = '';

        // Створюємо зони ресторану
        const zones = [
            {
                title: 'Біля вікна',
                class: 'window-zone',
                tables: this.tablesData.filter(table => table.location === 'Біля вікна')
            },
            {
                title: 'Центр залу',
                class: 'center-zone',
                tables: this.tablesData.filter(table => table.location === 'Центр залу')
            },
            {
                title: 'Великий зал',
                class: 'large-zone',
                tables: this.tablesData.filter(table => table.location === 'Великий зал')
            },
            {
                title: 'Приватна зона',
                class: 'private-zone',
                tables: this.tablesData.filter(table => table.location === 'Приватна зона')
            },
            {
                title: 'Біля бару',
                class: 'bar-zone',
                tables: this.tablesData.filter(table => table.location === 'Біля бару')
            }
        ];

        zones.forEach(zone => {
            if (zone.tables.length > 0) {
                const zoneElement = this.createZoneElement(zone);
                layoutContainer.appendChild(zoneElement);
            }
        });
    }

    /**
     * Створення елемента зони
     */
    createZoneElement(zone) {
        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'restaurant-zone';

        zoneDiv.innerHTML = `
            <div class="zone-title">${zone.title}</div>
            <div class="tables-grid ${zone.class}">
                ${zone.tables.map(table => this.createTableElement(table)).join('')}
            </div>
        `;

        return zoneDiv;
    }

    /**
     * Створення елемента столика
     */
    createTableElement(table) {
        const isSquare = table.capacity >= 6 ? 'square' : '';

        return `
            <div class="restaurant-table ${isSquare} available" 
                 data-table-id="${table.id}" 
                 data-capacity="${table.capacity}"
                 onclick="advancedReservation.selectTable(${table.id})">
                <div class="table-number">${table.table_number}</div>
                <div class="table-capacity">${table.capacity} місць</div>
            </div>
        `;
    }

    /**
     * Вибір столика
     */
    selectTable(tableId) {
        const tableElement = document.querySelector(`[data-table-id="${tableId}"]`);
        if (!tableElement || tableElement.classList.contains('occupied')) {
            return;
        }

        // Знімаємо вибір з інших столиків
        document.querySelectorAll('.restaurant-table.selected').forEach(table => {
            table.classList.remove('selected');
        });

        // Вибираємо поточний столик
        tableElement.classList.add('selected');

        // Зберігаємо обраний столик
        this.selectedTable = this.tablesData.find(table => table.id == tableId);

        // Оновлюємо приховане поле
        const selectedTableInput = document.getElementById('selected_table');
        if (selectedTableInput) {
            selectedTableInput.value = tableId;
        }

        // Оновлюємо сводку резервації
        this.updateReservationSummary();

        // Активуємо кнопку резервації
        this.updateReserveButton();
    }

    /**
     * Оновлення доступності столиків
     */
    async updateTableAvailability() {
        if (!this.calendar.getSelectedDate() || !this.calendar.getSelectedTime()) {
            return;
        }

        try {
            const dateString = this.calendar.formatDate(this.calendar.getSelectedDate());
            const response = await API.Reservations.getByDate(dateString);

            const reservations = response.success ? response.data : [];
            const selectedTime = this.calendar.getSelectedTime();

            // Знаходимо зайняті столики на обраний час
            const occupiedTables = new Set();

            reservations.forEach(reservation => {
                if (reservation.status === 'Підтверджено' || reservation.status === 'Прибули') {
                    const reservationTime = reservation.reservation_time.substring(0, 5);

                    // Перевіряємо перетин часу (резервація на 2 години)
                    if (this.timesOverlap(selectedTime, reservationTime)) {
                        occupiedTables.add(reservation.table_id);
                    }
                }
            });

            // Оновлюємо відображення столиків
            this.tablesData.forEach(table => {
                const tableElement = document.querySelector(`[data-table-id="${table.id}"]`);
                if (tableElement) {
                    // Очищуємо класи
                    tableElement.classList.remove('available', 'occupied');

                    // Перевіряємо доступність
                    const isOccupied = occupiedTables.has(table.id);
                    const hasEnoughCapacity = table.capacity >= this.guestCount;

                    if (isOccupied) {
                        tableElement.classList.add('occupied');
                        tableElement.style.pointerEvents = 'none';
                    } else if (hasEnoughCapacity) {
                        tableElement.classList.add('available');
                        tableElement.style.pointerEvents = 'auto';
                    } else {
                        tableElement.classList.add('occupied');
                        tableElement.style.pointerEvents = 'none';
                        tableElement.title = 'Недостатньо місць для вашої групи';
                    }
                }
            });

        } catch (error) {
            console.error('Помилка оновлення доступності столиків:', error);
        }
    }

    /**
     * Перевірка перетину часу
     */
    timesOverlap(time1, time2) {
        const [hours1, minutes1] = time1.split(':').map(Number);
        const [hours2, minutes2] = time2.split(':').map(Number);

        const minutes1Total = hours1 * 60 + minutes1;
        const minutes2Total = hours2 * 60 + minutes2;

        // Резервація триває 2 години (120 хвилин)
        const duration = 120;

        return Math.abs(minutes1Total - minutes2Total) < duration;
    }

    /**
     * Оновлення доступних столиків за кількістю гостей
     */
    updateAvailableTables() {
        this.tablesData.forEach(table => {
            const tableElement = document.querySelector(`[data-table-id="${table.id}"]`);
            if (tableElement && !tableElement.classList.contains('occupied')) {
                if (table.capacity >= this.guestCount) {
                    tableElement.classList.remove('occupied');
                    tableElement.classList.add('available');
                    tableElement.style.pointerEvents = 'auto';
                    tableElement.title = '';
                } else {
                    tableElement.classList.remove('available');
                    tableElement.classList.add('occupied');
                    tableElement.style.pointerEvents = 'none';
                    tableElement.title = 'Недостатньо місць для вашої групи';
                }
            }
        });

        // Скидаємо вибір столика, якщо він більше не підходить
        if (this.selectedTable && this.selectedTable.capacity < this.guestCount) {
            this.selectedTable = null;
            document.querySelectorAll('.restaurant-table.selected').forEach(table => {
                table.classList.remove('selected');
            });
            document.getElementById('selected_table').value = '';
        }

        this.updateReservationSummary();
        this.updateReserveButton();
    }

    /**
     * Оновлення сводки резервації
     */
    updateReservationSummary() {
        const summaryContainer = document.getElementById('reservation-summary');
        const summaryDate = document.getElementById('summary-date');
        const summaryTime = document.getElementById('summary-time');
        const summaryTable = document.getElementById('summary-table');
        const summaryCapacity = document.getElementById('summary-capacity');

        const hasDate = this.calendar.getSelectedDate();
        const hasTime = this.calendar.getSelectedTime();
        const hasTable = this.selectedTable;

        if (hasDate || hasTime || hasTable) {
            summaryContainer.style.display = 'block';

            if (summaryDate) {
                summaryDate.textContent = hasDate ? this.calendar.formatDateForDisplay(this.calendar.getSelectedDate()) : '-';
            }

            if (summaryTime) {
                summaryTime.textContent = hasTime || '-';
            }

            if (summaryTable) {
                summaryTable.textContent = hasTable ? `№${this.selectedTable.table_number} (${this.selectedTable.location})` : '-';
            }

            if (summaryCapacity) {
                summaryCapacity.textContent = hasTable ? `${this.selectedTable.capacity} місць` : '-';
            }
        } else {
            summaryContainer.style.display = 'none';
        }
    }

    /**
     * Оновлення кнопки резервації
     */
    updateReserveButton() {
        const reserveBtn = document.getElementById('reserve-btn');
        if (!reserveBtn) return;

        const hasDate = this.calendar.getSelectedDate();
        const hasTime = this.calendar.getSelectedTime();
        const hasTable = this.selectedTable;

        if (hasDate && hasTime && hasTable) {
            reserveBtn.disabled = false;
            reserveBtn.textContent = '💳 Забронювати столик';
        } else {
            reserveBtn.disabled = true;
            let missingText = 'Оберіть: ';
            const missing = [];

            if (!hasDate) missing.push('дату');
            if (!hasTime) missing.push('час');
            if (!hasTable) missing.push('столик');

            reserveBtn.textContent = missingText + missing.join(', ');
        }
    }

    /**
     * Обробники подій календаря
     */
    onDateSelected(detail) {
        this.updateReservationSummary();
        this.updateReserveButton();

        // Скидаємо вибір столика при зміні дати
        this.selectedTable = null;
        document.querySelectorAll('.restaurant-table.selected').forEach(table => {
            table.classList.remove('selected');
        });
        document.getElementById('selected_table').value = '';
    }

    onTimeSelected(detail) {
        this.updateReservationSummary();
        this.updateReserveButton();
        this.updateTableAvailability();

        // Скидаємо вибір столика при зміні часу
        this.selectedTable = null;
        document.querySelectorAll('.restaurant-table.selected').forEach(table => {
            table.classList.remove('selected');
        });
        document.getElementById('selected_table').value = '';
    }

    /**
     * Обробка подання форми резервації
     */
    async handleReservationSubmit() {
        if (!this.validateReservation()) {
            return;
        }

        if (!validateForm('advanced-reservation-form')) {
            showAlert('Будь ласка, заповніть всі обов\'язкові поля', 'warning');
            return;
        }

        try {
            showLoading();

            const formData = getFormData('advanced-reservation-form');

            // Додаємо обрані дані
            formData.reservation_date = this.calendar.formatDate(this.calendar.getSelectedDate());
            formData.reservation_time = this.calendar.getSelectedTime();
            formData.table_id = this.selectedTable.id;
            formData.number_of_guests = this.guestCount;

            // Обробляємо додаткові послуги
            formData.special_requests = this.getSpecialRequests();

            const response = await API.Reservations.create(formData);

            hideLoading();

            if (response.success) {
                this.showConfirmationModal(response.data);
                this.resetForm();
                await this.loadTodayReservations();
            }

        } catch (error) {
            hideLoading();
            console.error('Помилка створення резервації:', error);
            showAlert('Помилка створення резервації: ' + error.message, 'danger');
        }
    }

    /**
     * Валідація резервації
     */
    validateReservation() {
        if (!this.calendar.getSelectedDate()) {
            showAlert('Будь ласка, оберіть дату', 'warning');
            return false;
        }

        if (!this.calendar.getSelectedTime()) {
            showAlert('Будь ласка, оберіть час', 'warning');
            return false;
        }

        if (!this.selectedTable) {
            showAlert('Будь ласка, оберіть столик', 'warning');
            return false;
        }

        return true;
    }

    /**
     * Отримання спеціальних запитів
     */
    getSpecialRequests() {
        const form = document.getElementById('advanced-reservation-form');
        const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
        const requests = [];

        checkboxes.forEach(checkbox => {
            const label = checkbox.parentElement.textContent.trim();
            requests.push(label);
        });

        return requests.length > 0 ? requests.join(', ') : '';
    }

    /**
     * Показ модального вікна підтвердження
     */
    showConfirmationModal(reservationData) {
        const confirmationDetails = document.getElementById('confirmation-details');
        if (confirmationDetails) {
            confirmationDetails.innerHTML = `
                <div class="summary-item">
                    <strong>Дата:</strong> <span>${this.calendar.formatDateForDisplay(this.calendar.getSelectedDate())}</span>
                </div>
                <div class="summary-item">
                    <strong>Час:</strong> <span>${this.calendar.getSelectedTime()}</span>
                </div>
                <div class="summary-item">
                    <strong>Столик:</strong> <span>№${this.selectedTable.table_number}</span>
                </div>
                <div class="summary-item">
                    <strong>Гостей:</strong> <span>${this.guestCount}</span>
                </div>
                <div class="summary-item">
                    <strong>Номер резервації:</strong> <span>#${reservationData.id || 'RES' + Date.now()}</span>
                </div>
            `;
        }

        showModal('confirmation-modal');
    }

    /**
     * Скидання форми
     */
    resetForm() {
        // Скидаємо календар
        this.calendar.reset();

        // Скидаємо вибір столика
        this.selectedTable = null;
        document.querySelectorAll('.restaurant-table.selected').forEach(table => {
            table.classList.remove('selected');
        });

        // Очищуємо форму
        clearForm('advanced-reservation-form');

        // Скидаємо кількість гостей
        this.guestCount = 2;
        document.getElementById('adv_guests').value = 2;

        // Приховуємо сводку
        document.getElementById('reservation-summary').style.display = 'none';

        // Деактивуємо кнопку
        this.updateReserveButton();
    }

    /**
     * Завантаження сьогоднішніх резервацій
     */
    async loadTodayReservations() {
        try {
            const today = new Date();
            const dateString = this.calendar.formatDate(today);

            const response = await API.Reservations.getByDate(dateString);

            if (response.success) {
                this.renderTodayReservations(response.data);
            }

        } catch (error) {
            console.error('Помилка завантаження сьогоднішніх резервацій:', error);
            this.renderTodayReservationsError();
        }
    }

    /**
     * Відображення сьогоднішніх резервацій
     */
    renderTodayReservations(reservations) {
        const container = document.getElementById('today-reservations');
        if (!container) return;

        if (!reservations || reservations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h4>Сьогодні резервацій немає</h4>
                    <p>Станьте першим, хто забронює столик на сьогодні!</p>
                </div>
            `;
            return;
        }

        // Сортуємо за часом
        reservations.sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));

        container.innerHTML = reservations.map(reservation => `
            <div class="reservation-card fade-in">
                <div class="reservation-header">
                    <div class="reservation-time">${formatTime(reservation.reservation_time)}</div>
                    <div class="reservation-status ${reservation.status.toLowerCase().replace('ї', 'i').replace('я', 'ya')}">
                        ${reservation.status}
                    </div>
                </div>
                <div class="reservation-details">
                    <strong>${reservation.customer_name}</strong><br>
                    Столик №${reservation.table_number}<br>
                    ${reservation.number_of_guests} ${this.getGuestWord(reservation.number_of_guests)}<br>
                    ${reservation.customer_phone}
                    ${reservation.notes ? `<br><em>"${reservation.notes}"</em>` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Відображення помилки резервацій
     */
    renderTodayReservationsError() {
        const container = document.getElementById('today-reservations');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h4>Помилка завантаження</h4>
                    <p>Не вдалося завантажити резервації.</p>
                </div>
            `;
        }
    }

    /**
     * Допоміжна функція для відмінювання слова "гість"
     */
    getGuestWord(count) {
        if (count === 1) return 'гість';
        if (count >= 2 && count <= 4) return 'гості';
        return 'гостей';
    }
}

// Ініціалізуємо систему після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    window.advancedReservation = new AdvancedReservationSystem();
});

// Експортуємо клас для глобального використання
window.AdvancedReservationSystem = AdvancedReservationSystem;