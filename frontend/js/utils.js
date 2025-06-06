// js/utils.js - Допоміжні функції та утіліти

/**
 * Показати повідомлення (alert)
 */
function showAlert(message, type = 'info', duration = 5000) {
    // Створюємо елемент alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Знаходимо контейнер для alerts або створюємо його
    let alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alert-container';
        alertContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1060;
            max-width: 400px;
        `;
        document.body.appendChild(alertContainer);
    }

    // Додаємо alert
    alertContainer.appendChild(alertDiv);

    // Автоматично видаляємо через заданий час
    if (duration > 0) {
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, duration);
    }
}

/**
 * Показати/сховати індикатор завантаження
 */
let loadingCounter = 0;

function showLoading() {
    loadingCounter++;

    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(2px);
        `;
        loader.innerHTML = `
            <div class="text-center">
                <div class="spinner" style="width: 40px; height: 40px; border-width: 4px;"></div>
                <div style="margin-top: 10px; color: var(--gray-700);">Завантаження...</div>
            </div>
        `;
        document.body.appendChild(loader);
    }

    loader.style.display = 'flex';
}

function hideLoading() {
    loadingCounter = Math.max(0, loadingCounter - 1);

    if (loadingCounter === 0) {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

/**
 * Модальні вікна
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Закриття модального вікна при кліку поза ним
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        hideModal(e.target.id);
    }
});

// Закриття модального вікна при натисканні Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            hideModal(openModal.id);
        }
    }
});

/**
 * Форматування дати та часу
 */
function formatDate(dateString, includeTime = false) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return date.toLocaleDateString('uk-UA', options);
}

function formatTime(timeString) {
    if (!timeString) return '';

    // Якщо час у форматі HH:MM:SS, обрізаємо секунди
    if (timeString.includes(':')) {
        const parts = timeString.split(':');
        return `${parts[0]}:${parts[1]}`;
    }

    return timeString;
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';

    const date = new Date(dateTimeString);
    return date.toLocaleString('uk-UA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Форматування валюти
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '';

    return new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: 'UAH',
        minimumFractionDigits: 2
    }).format(amount);
}

/**
 * Валідація форм
 */
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const inputs = form.querySelectorAll('[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });

    // Перевірка email
    const emailInputs = form.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        if (input.value && !isValidEmail(input.value)) {
            input.classList.add('is-invalid');
            isValid = false;
        }
    });

    // Перевірка телефону
    const phoneInputs = form.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        if (input.value && !isValidPhone(input.value)) {
            input.classList.add('is-invalid');
            isValid = false;
        }
    });

    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

/**
 * Робота з формами
 */
function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};

    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        // Обробка checkbox
        if (form.querySelector(`[name="${key}"]`).type === 'checkbox') {
            data[key] = form.querySelector(`[name="${key}"]`).checked;
        } else {
            data[key] = value;
        }
    }

    return data;
}

function setFormData(formId, data) {
    const form = document.getElementById(formId);
    if (!form) return;

    Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = Boolean(data[key]);
            } else {
                input.value = data[key] || '';
            }
        }
    });
}

function clearForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.reset();

    // Видаляємо класи валідації
    const inputs = form.querySelectorAll('.is-invalid, .is-valid');
    inputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
}

/**
 * Робота з таблицями
 */
function createTableRow(data, columns) {
    const row = document.createElement('tr');

    columns.forEach(column => {
        const cell = document.createElement('td');

        if (typeof column === 'string') {
            cell.textContent = data[column] || '';
        } else if (typeof column === 'object') {
            if (column.formatter) {
                cell.innerHTML = column.formatter(data[column.key], data);
            } else {
                cell.textContent = data[column.key] || '';
            }
        }

        row.appendChild(cell);
    });

    return row;
}

function updateTable(tableId, data, columns) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Очищуємо таблицю
    tbody.innerHTML = '';

    // Додаємо нові рядки
    data.forEach(item => {
        const row = createTableRow(item, columns);
        tbody.appendChild(row);
    });
}

/**
 * Сортування таблиць
 */
function sortTable(tableId, columnIndex, ascending = true) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        const aText = a.cells[columnIndex].textContent.trim();
        const bText = b.cells[columnIndex].textContent.trim();

        // Спробуємо конвертувати в числа
        const aNum = parseFloat(aText);
        const bNum = parseFloat(bText);

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return ascending ? aNum - bNum : bNum - aNum;
        } else {
            return ascending ? aText.localeCompare(bText) : bText.localeCompare(aText);
        }
    });

    // Перебудовуємо таблицю
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * Фільтрація таблиць
 */
function filterTable(tableId, searchValue, columns = []) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');

    searchValue = searchValue.toLowerCase();

    rows.forEach(row => {
        let found = false;

        if (columns.length === 0) {
            // Пошук по всіх колонках
            const cells = row.querySelectorAll('td');
            found = Array.from(cells).some(cell =>
                cell.textContent.toLowerCase().includes(searchValue)
            );
        } else {
            // Пошук по вказаних колонках
            found = columns.some(columnIndex => {
                const cell = row.cells[columnIndex];
                return cell && cell.textContent.toLowerCase().includes(searchValue);
            });
        }

        row.style.display = found ? '' : 'none';
    });
}

/**
 * Роботу з localStorage
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Помилка збереження в localStorage:', error);
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Помилка завантаження з localStorage:', error);
        return defaultValue;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Помилка видалення з localStorage:', error);
    }
}

/**
 * Дебаунс функція для оптимізації пошуку
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Копіювання тексту в буфер обміну
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showAlert('Скопійовано в буфер обміну', 'success', 2000);
    } catch (error) {
        console.error('Помилка копіювання:', error);
        showAlert('Помилка копіювання', 'danger', 3000);
    }
}

/**
 * Експорт даних в CSV
 */
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showAlert('Немає даних для експорту', 'warning');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header =>
                `"${String(row[header] || '').replace(/"/g, '""')}"`
            ).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Ініціалізація спільних обробників подій
 */
document.addEventListener('DOMContentLoaded', function() {
    // Додаємо клас is-invalid для невалідних полів
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });

        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid') && this.value.trim()) {
                this.classList.remove('is-invalid');
            }
        });
    });
});

// Експортуємо утіліти для глобального використання
window.Utils = {
    showAlert,
    showLoading,
    hideLoading,
    showModal,
    hideModal,
    formatDate,
    formatTime,
    formatDateTime,
    formatCurrency,
    validateForm,
    isValidEmail,
    isValidPhone,
    getFormData,
    setFormData,
    clearForm,
    createTableRow,
    updateTable,
    sortTable,
    filterTable,
    saveToStorage,
    loadFromStorage,
    removeFromStorage,
    debounce,
    copyToClipboard,
    exportToCSV
};