// Professional Calendar Application - JavaScript
class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.currentView = 'month';
        this.events = this.loadEvents();
        this.keyboardNavEnabled = false;
        this.focusedCell = null;
        
        // Taiwan holidays data
        this.taiwanHolidays = [
            {"title": "元旦", "date": "2025-01-01"},
            {"title": "調整放假，於2/8(六)補班", "date": "2025-01-27"},
            {"title": "除夕", "date": "2025-01-28"},
            {"title": "春節", "date": "2025-01-29"},
            {"title": "春節", "date": "2025-01-30"},
            {"title": "春節", "date": "2025-01-31"},
            {"title": "228紀念日", "date": "2025-02-28"},
            {"title": "兒童節提前放假", "date": "2025-04-03"},
            {"title": "兒童節+民族掃墓節", "date": "2025-04-04"},
            {"title": "勞動節", "date": "2025-05-01"},
            {"title": "端午節提前放假", "date": "2025-05-30"},
            {"title": "端午節", "date": "2025-05-31"},
            {"title": "教師節補假", "date": "2025-09-29"},
            {"title": "中秋節", "date": "2025-10-06"},
            {"title": "雙十節", "date": "2025-10-10"},
            {"title": "光復節", "date": "2025-10-24"},
            {"title": "行憲紀念日", "date": "2025-12-25"}
        ];

        this.colors = ["blue", "green", "yellow", "purple", "red", "orange", "pink", "teal"];
        this.eventTypes = ["工作", "個人", "假期"];
        this.repeatOptions = ["不重複", "每日", "每週", "每月", "每年"];

        this.init();
    }

    init() {
        this.bindEvents();
        this.setupKeyboardNavigation();
        this.renderCurrentView();
        this.updateCurrentDateDisplay();
        this.applyTheme();
    }

    bindEvents() {
        // Navigation controls
        document.getElementById('prevBtn').addEventListener('click', () => this.navigatePrevious());
        document.getElementById('nextBtn').addEventListener('click', () => this.navigateNext());
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeView(e.target.dataset.view));
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Event management
        document.getElementById('addEventBtn').addEventListener('click', () => this.openEventModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeEventModal());
        document.getElementById('cancelEvent').addEventListener('click', () => this.closeEventModal());
        document.getElementById('saveEvent').addEventListener('click', () => this.saveEvent());
        document.getElementById('deleteEvent').addEventListener('click', () => this.deleteEvent());

        // Search and filter
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterEvents(e.target.value));
        document.getElementById('filterSelect').addEventListener('change', (e) => this.filterByType(e.target.value));

        // Color filters
        document.querySelectorAll('.color-filter').forEach(filter => {
            filter.addEventListener('click', (e) => this.toggleColorFilter(e.currentTarget.dataset.color));
        });

        // Color picker
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
        });

        // Import/Export
        document.getElementById('importBtn').addEventListener('click', () => this.triggerImport());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportEvents());
        document.getElementById('importFile').addEventListener('change', (e) => this.importEvents(e));

        // Modal backdrop click
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') {
                this.closeEventModal();
            }
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Start keyboard navigation with Tab
            if (e.key === 'Tab' && !this.keyboardNavEnabled) {
                const firstCalendarCell = document.querySelector('.calendar-cell[data-date]');
                if (firstCalendarCell && this.currentView === 'month') {
                    e.preventDefault();
                    this.enableKeyboardNavigation();
                    this.focusCell(firstCalendarCell);
                }
                return;
            }

            // Handle keyboard navigation when enabled
            if (this.keyboardNavEnabled && this.currentView === 'month') {
                this.handleKeyboardNavigation(e);
            }

            // Escape key handling
            if (e.key === 'Escape') {
                if (document.getElementById('eventModal').classList.contains('active')) {
                    this.closeEventModal();
                } else if (this.keyboardNavEnabled) {
                    this.disableKeyboardNavigation();
                }
            }
        });
    }

    enableKeyboardNavigation() {
        this.keyboardNavEnabled = true;
        const today = new Date();
        const todayStr = this.formatDate(today);
        let targetCell = document.querySelector(`[data-date="${todayStr}"]`);
        
        if (!targetCell) {
            targetCell = document.querySelector('.calendar-cell[data-date]');
        }
        
        if (targetCell) {
            this.focusCell(targetCell);
        }
    }

    disableKeyboardNavigation() {
        this.keyboardNavEnabled = false;
        if (this.focusedCell) {
            this.focusedCell.classList.remove('keyboard-focus');
            this.focusedCell.removeAttribute('tabindex');
            this.focusedCell = null;
        }
    }

    focusCell(cell) {
        if (this.focusedCell) {
            this.focusedCell.classList.remove('keyboard-focus');
            this.focusedCell.removeAttribute('tabindex');
        }
        
        this.focusedCell = cell;
        cell.classList.add('keyboard-focus');
        cell.setAttribute('tabindex', '0');
        cell.focus();
    }

    handleKeyboardNavigation(e) {
        if (!this.focusedCell) return;

        const currentDate = new Date(this.focusedCell.dataset.date);
        let newDate = new Date(currentDate);

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                newDate.setDate(currentDate.getDate() - 1);
                this.navigateToDate(newDate);
                break;
            case 'ArrowRight':
                e.preventDefault();
                newDate.setDate(currentDate.getDate() + 1);
                this.navigateToDate(newDate);
                break;
            case 'ArrowUp':
                e.preventDefault();
                newDate.setDate(currentDate.getDate() - 7);
                this.navigateToDate(newDate);
                break;
            case 'ArrowDown':
                e.preventDefault();
                newDate.setDate(currentDate.getDate() + 7);
                this.navigateToDate(newDate);
                break;
            case 'Home':
                e.preventDefault();
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                this.navigateToDate(startOfWeek);
                break;
            case 'End':
                e.preventDefault();
                const endOfWeek = new Date(currentDate);
                endOfWeek.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
                this.navigateToDate(endOfWeek);
                break;
            case 'PageUp':
                e.preventDefault();
                newDate.setMonth(currentDate.getMonth() - 1);
                this.navigateToDate(newDate);
                break;
            case 'PageDown':
                e.preventDefault();
                newDate.setMonth(currentDate.getMonth() + 1);
                this.navigateToDate(newDate);
                break;
            case 'Enter':
                e.preventDefault();
                this.selectDate(currentDate);
                this.openEventModal(currentDate);
                break;
        }
    }

    navigateToDate(date) {
        const targetDateStr = this.formatDate(date);
        
        // If date is in different month, navigate to that month
        if (date.getMonth() !== this.currentDate.getMonth() || date.getFullYear() !== this.currentDate.getFullYear()) {
            this.currentDate = new Date(date);
            this.renderCurrentView();
            this.updateCurrentDateDisplay();
        }
        
        // Focus the target cell
        setTimeout(() => {
            const targetCell = document.querySelector(`[data-date="${targetDateStr}"]`);
            if (targetCell) {
                this.focusCell(targetCell);
            }
        }, 50);
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.renderCurrentView();
    }

    navigatePrevious() {
        switch (this.currentView) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
            case 'year':
                this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
                break;
        }
        this.renderCurrentView();
        this.updateCurrentDateDisplay();
    }

    navigateNext() {
        switch (this.currentView) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
            case 'year':
                this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
                break;
        }
        this.renderCurrentView();
        this.updateCurrentDateDisplay();
    }

    goToToday() {
        this.currentDate = new Date();
        this.renderCurrentView();
        this.updateCurrentDateDisplay();
    }

    changeView(view) {
        this.currentView = view;
        this.disableKeyboardNavigation();
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Hide all views
        document.querySelectorAll('.calendar-view').forEach(view => view.classList.add('hidden'));
        
        // Show selected view
        document.getElementById(`${view}View`).classList.remove('hidden');
        
        this.renderCurrentView();
        this.updateCurrentDateDisplay();
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
            case 'year':
                this.renderYearView();
                break;
        }
    }

    renderMonthView() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();
        const todayStr = this.formatDate(today);

        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.dataset.date = this.formatDate(cellDate);
            
            // Add classes
            if (cellDate.getMonth() !== this.currentDate.getMonth()) {
                cell.classList.add('other-month');
            }
            if (this.formatDate(cellDate) === todayStr) {
                cell.classList.add('today');
            }
            if (this.selectedDate && this.formatDate(cellDate) === this.formatDate(this.selectedDate)) {
                cell.classList.add('selected');
            }

            // Check for holidays
            const holiday = this.taiwanHolidays.find(h => h.date === this.formatDate(cellDate));
            if (holiday) {
                cell.classList.add('holiday');
            }

            // Create cell content
            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = cellDate.getDate();
            cell.appendChild(dateNumber);

            // Add holiday name
            if (holiday) {
                const holidayName = document.createElement('div');
                holidayName.className = 'holiday-name';
                holidayName.textContent = holiday.title;
                cell.appendChild(holidayName);
            }

            // Add events
            const dayEvents = this.getEventsForDate(cellDate);
            dayEvents.forEach((event, index) => {
                if (index < 3) { // Limit to 3 events per cell
                    const eventEl = document.createElement('div');
                    eventEl.className = `event-item event-${event.color}`;
                    eventEl.textContent = event.title;
                    eventEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.editEvent(event);
                    });
                    cell.appendChild(eventEl);
                }
            });

            // Add more indicator
            if (dayEvents.length > 3) {
                const moreEl = document.createElement('div');
                moreEl.className = 'event-item';
                moreEl.textContent = `+${dayEvents.length - 3} more`;
                moreEl.style.fontSize = '10px';
                moreEl.style.opacity = '0.7';
                cell.appendChild(moreEl);
            }

            // Add click handler
            cell.addEventListener('click', () => {
                this.selectDate(cellDate);
                this.openEventModal(cellDate);
            });

            // Add accessibility attributes
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', this.getAriaLabel(cellDate, holiday, dayEvents));

            grid.appendChild(cell);
        }
    }

    renderWeekView() {
        const weekDays = document.getElementById('weekDays');
        const weekGrid = document.getElementById('weekGrid');
        const timeSlots = document.getElementById('timeSlots');
        
        weekDays.innerHTML = '';
        weekGrid.innerHTML = '';
        timeSlots.innerHTML = '';

        // Get week start
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());

        // Render week days header
        const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            
            const dayEl = document.createElement('div');
            dayEl.className = 'week-day';
            dayEl.innerHTML = `
                <div>${dayNames[i]}</div>
                <div>${date.getDate()}</div>
            `;
            weekDays.appendChild(dayEl);
        }

        // Render time slots
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeSlots.appendChild(timeSlot);
        }

        // Render week grid
        for (let i = 0; i < 7; i++) {
            const column = document.createElement('div');
            column.className = 'week-column';
            
            for (let hour = 0; hour < 24; hour++) {
                const hourRow = document.createElement('div');
                hourRow.className = 'hour-row';
                column.appendChild(hourRow);
            }
            
            weekGrid.appendChild(column);
        }
    }

    renderDayView() {
        const dayTitle = document.getElementById('dayTitle');
        const dayTimeSlots = document.getElementById('dayTimeSlots');
        const dayEvents = document.getElementById('dayEvents');
        
        dayTitle.textContent = this.formatDateLong(this.currentDate);
        dayTimeSlots.innerHTML = '';
        dayEvents.innerHTML = '';

        // Render time slots
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            dayTimeSlots.appendChild(timeSlot);
        }

        // Render day events
        const events = this.getEventsForDate(this.currentDate);
        events.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = `event-item event-${event.color}`;
            eventEl.style.marginBottom = '8px';
            eventEl.innerHTML = `
                <div style="font-weight: bold;">${event.title}</div>
                <div style="font-size: 12px; opacity: 0.8;">${event.startTime} - ${event.endTime}</div>
                <div style="font-size: 12px; opacity: 0.8;">${event.description}</div>
            `;
            eventEl.addEventListener('click', () => this.editEvent(event));
            dayEvents.appendChild(eventEl);
        });
    }

    renderYearView() {
        const yearGrid = document.getElementById('yearGrid');
        yearGrid.innerHTML = '';

        const monthNames = [
            '一月', '二月', '三月', '四月', '五月', '六月',
            '七月', '八月', '九月', '十月', '十一月', '十二月'
        ];

        for (let month = 0; month < 12; month++) {
            const monthEl = document.createElement('div');
            monthEl.className = 'month-mini';
            
            const header = document.createElement('div');
            header.className = 'month-mini-header';
            header.textContent = `${this.currentDate.getFullYear()}年 ${monthNames[month]}`;
            monthEl.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'month-mini-grid';

            const firstDay = new Date(this.currentDate.getFullYear(), month, 1);
            const lastDay = new Date(this.currentDate.getFullYear(), month + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());

            const today = new Date();

            for (let i = 0; i < 42; i++) {
                const cellDate = new Date(startDate);
                cellDate.setDate(startDate.getDate() + i);
                
                const cell = document.createElement('div');
                cell.className = 'month-mini-cell';
                
                if (cellDate.getMonth() === month) {
                    cell.textContent = cellDate.getDate();
                    if (this.isSameDate(cellDate, today)) {
                        cell.classList.add('today');
                    }
                    cell.addEventListener('click', () => {
                        this.currentDate = new Date(cellDate);
                        this.changeView('month');
                    });
                }
                
                grid.appendChild(cell);
            }

            monthEl.appendChild(grid);
            yearGrid.appendChild(monthEl);
        }
    }

    updateCurrentDateDisplay() {
        const dateEl = document.getElementById('currentDate');
        let dateStr = '';

        switch (this.currentView) {
            case 'month':
                dateStr = `${this.currentDate.getFullYear()}年 ${this.currentDate.getMonth() + 1}月`;
                break;
            case 'week':
                const startOfWeek = new Date(this.currentDate);
                startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                dateStr = `${this.formatDateShort(startOfWeek)} - ${this.formatDateShort(endOfWeek)}`;
                break;
            case 'day':
                dateStr = this.formatDateLong(this.currentDate);
                break;
            case 'year':
                dateStr = `${this.currentDate.getFullYear()}年`;
                break;
        }

        dateEl.textContent = dateStr;
    }

    openEventModal(date = null) {
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('eventForm');
        
        if (date) {
            document.getElementById('eventDate').value = this.formatDate(date);
        }
        
        modalTitle.textContent = '新增事件';
        document.getElementById('deleteEvent').style.display = 'none';
        form.reset();
        this.selectColor('blue'); // Default color
        
        modal.classList.add('active');
        document.getElementById('eventTitle').focus();
    }

    editEvent(event) {
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('modalTitle');
        
        modalTitle.textContent = '編輯事件';
        document.getElementById('deleteEvent').style.display = 'block';
        
        // Populate form
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventStartTime').value = event.startTime || '';
        document.getElementById('eventEndTime').value = event.endTime || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventType').value = event.type || '個人';
        document.getElementById('eventRepeat').value = event.repeat || '不重複';
        
        this.selectColor(event.color || 'blue');
        modal.dataset.eventId = event.id;
        
        modal.classList.add('active');
        document.getElementById('eventTitle').focus();
    }

    closeEventModal() {
        const modal = document.getElementById('eventModal');
        modal.classList.remove('active');
        delete modal.dataset.eventId;
    }

    saveEvent() {
        const modal = document.getElementById('eventModal');
        const eventId = modal.dataset.eventId;
        
        const eventData = {
            id: eventId || Date.now().toString(),
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            startTime: document.getElementById('eventStartTime').value,
            endTime: document.getElementById('eventEndTime').value,
            description: document.getElementById('eventDescription').value,
            type: document.getElementById('eventType').value,
            color: document.getElementById('eventColor').value,
            repeat: document.getElementById('eventRepeat').value
        };

        if (!eventData.title || !eventData.date) {
            alert('請填寫標題和日期');
            return;
        }

        if (eventId) {
            // Update existing event
            const index = this.events.findIndex(e => e.id === eventId);
            if (index !== -1) {
                this.events[index] = eventData;
            }
        } else {
            // Add new event
            this.events.push(eventData);
        }

        this.saveEvents();
        this.renderCurrentView();
        this.closeEventModal();
    }

    deleteEvent() {
        const modal = document.getElementById('eventModal');
        const eventId = modal.dataset.eventId;
        
        if (eventId && confirm('確定要刪除這個事件嗎？')) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveEvents();
            this.renderCurrentView();
            this.closeEventModal();
        }
    }

    selectColor(color) {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-color="${color}"]`).classList.add('selected');
        document.getElementById('eventColor').value = color;
    }

    getEventsForDate(date) {
        const dateStr = this.formatDate(date);
        return this.events.filter(event => event.date === dateStr);
    }

    filterEvents(searchTerm) {
        // Implementation for search filtering
        this.renderCurrentView();
    }

    filterByType(type) {
        // Implementation for type filtering
        this.renderCurrentView();
    }

    toggleColorFilter(color) {
        const filter = document.querySelector(`[data-color="${color}"]`);
        filter.classList.toggle('active');
        this.renderCurrentView();
    }

    toggleTheme() {
        const currentTheme = document.body.dataset.colorScheme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.dataset.colorScheme = newTheme;
        document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        // Save theme preference
        try {
            const settings = JSON.parse(localStorage.getItem('calendarSettings') || '{}');
            settings.theme = newTheme;
            localStorage.setItem('calendarSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Could not save theme preference');
        }
    }

    applyTheme() {
        try {
            const settings = JSON.parse(localStorage.getItem('calendarSettings') || '{}');
            const theme = settings.theme || 'light';
            document.body.dataset.colorScheme = theme;
            document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
        } catch (e) {
            console.warn('Could not load theme preference');
        }
    }

    triggerImport() {
        document.getElementById('importFile').click();
    }

    importEvents(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedEvents = JSON.parse(e.target.result);
                if (Array.isArray(importedEvents)) {
                    this.events = [...this.events, ...importedEvents];
                    this.saveEvents();
                    this.renderCurrentView();
                    alert('事件導入成功！');
                }
            } catch (error) {
                alert('導入失敗：文件格式不正確');
            }
        };
        reader.readAsText(file);
    }

    exportEvents() {
        const dataStr = JSON.stringify(this.events, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `calendar-events-${this.formatDate(new Date())}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    saveEvents() {
        try {
            localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        } catch (e) {
            console.warn('Could not save events to localStorage');
        }
    }

    loadEvents() {
        try {
            const saved = localStorage.getItem('calendarEvents');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Could not load events from localStorage');
            return [];
        }
    }

    // Utility functions
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateShort(date) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    formatDateLong(date) {
        const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${days[date.getDay()]}`;
    }

    isSameDate(date1, date2) {
        return this.formatDate(date1) === this.formatDate(date2);
    }

    getAriaLabel(date, holiday, events) {
        let label = `${date.getMonth() + 1}月${date.getDate()}日`;
        if (holiday) {
            label += `, ${holiday.title}`;
        }
        if (events.length > 0) {
            label += `, ${events.length}個事件`;
        }
        return label;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CalendarApp();
});