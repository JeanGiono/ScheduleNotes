// 專業行程管理工具 JavaScript
class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.events = [];
        this.filters = {
            colors: [],
            type: '',
            search: ''
        };
        this.selectedDate = null;
        this.editingEvent = null;
        this.draggedEvent = null;
        
        // Taiwan holidays 2025
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
        
        this.init();
    }
    
    init() {
        this.loadEvents();
        this.loadHolidays();
        this.setupEventListeners();
        this.setupColorFilters();
        this.renderCalendar();
        this.updateMiniCalendar();
        this.updateStatusBar();
        this.setupKeyboardShortcuts();
        this.initTheme();
    }
    
    loadEvents() {
        const savedEvents = localStorage.getItem('calendar-events');
        if (savedEvents) {
            this.events = JSON.parse(savedEvents);
        }
    }
    
    saveEvents() {
        localStorage.setItem('calendar-events', JSON.stringify(this.events));
    }
    
    loadHolidays() {
        // 檢查是否已載入假期
        const hasHolidays = this.events.some(event => event.type === 'holiday');
        if (!hasHolidays) {
            this.taiwanHolidays.forEach(holiday => {
                this.events.push({
                    id: this.generateId(),
                    title: holiday.title,
                    startDate: holiday.date,
                    endDate: holiday.date,
                    allDay: true,
                    color: 'holiday',
                    type: 'holiday',
                    repeat: 'none',
                    description: '台灣法定假期'
                });
            });
            this.saveEvents();
        }
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    setupEventListeners() {
        // Header buttons
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('show');
        });
        
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        document.getElementById('addEventBtn').addEventListener('click', () => {
            this.openEventModal();
        });
        
        // View selector
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });
        
        // Navigation
        document.getElementById('prevPeriod').addEventListener('click', () => {
            this.navigatePeriod(-1);
        });
        
        document.getElementById('nextPeriod').addEventListener('click', () => {
            this.navigatePeriod(1);
        });
        
        document.getElementById('todayBtn').addEventListener('click', () => {
            this.goToToday();
        });
        
        // Mini calendar
        document.getElementById('miniPrevMonth').addEventListener('click', () => {
            this.navigateMiniCalendar(-1);
        });
        
        document.getElementById('miniNextMonth').addEventListener('click', () => {
            this.navigateMiniCalendar(1);
        });
        
        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.renderCalendar();
        });
        
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.renderCalendar();
        });
        
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Import/Export
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importICS(e.target.files[0]);
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportICS();
        });
        
        document.getElementById('backupBtn').addEventListener('click', () => {
            this.backupData();
        });
        
        document.getElementById('restoreBtn').addEventListener('click', () => {
            this.restoreData();
        });
        
        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeEventModal();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeEventModal();
        });
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveEvent();
        });
        
        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.deleteEvent();
        });
        
        document.getElementById('eventAllDay').addEventListener('change', (e) => {
            this.toggleTimeFields(e.target.checked);
        });
        
        // Quick add modal
        document.getElementById('closeQuickModal').addEventListener('click', () => {
            this.closeQuickModal();
        });
        
        document.getElementById('quickSaveBtn').addEventListener('click', () => {
            this.saveQuickEvent();
        });
        
        document.getElementById('quickEventTitle').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveQuickEvent();
            }
        });
        
        // Context menu
        document.getElementById('editEvent').addEventListener('click', () => {
            this.editContextEvent();
        });
        
        document.getElementById('deleteEvent').addEventListener('click', () => {
            this.deleteContextEvent();
        });
        
        document.getElementById('duplicateEvent').addEventListener('click', () => {
            this.duplicateContextEvent();
        });
        
        // Close modals and context menu on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeEventModal();
                this.closeQuickModal();
            }
            
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.event-item')) {
                e.preventDefault();
                this.showContextMenu(e, e.target.closest('.event-item'));
            }
        });
    }
    
    setupColorFilters() {
        const colorFilters = document.getElementById('colorFilters');
        const colors = ['blue', 'green', 'yellow', 'purple', 'red', 'orange', 'pink', 'teal'];
        
        colors.forEach(color => {
            const filter = document.createElement('div');
            filter.className = `color-filter ${color}`;
            filter.dataset.color = color;
            filter.addEventListener('click', () => {
                this.toggleColorFilter(color);
            });
            colorFilters.appendChild(filter);
        });
    }
    
    toggleColorFilter(color) {
        const filterElement = document.querySelector(`[data-color="${color}"]`);
        filterElement.classList.toggle('active');
        
        if (this.filters.colors.includes(color)) {
            this.filters.colors = this.filters.colors.filter(c => c !== color);
        } else {
            this.filters.colors.push(color);
        }
        
        this.renderCalendar();
    }
    
    clearFilters() {
        this.filters = { colors: [], type: '', search: '' };
        document.getElementById('searchInput').value = '';
        document.getElementById('typeFilter').value = '';
        document.querySelectorAll('.color-filter').forEach(filter => {
            filter.classList.remove('active');
        });
        this.renderCalendar();
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openEventModal();
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('searchInput').focus();
                        break;
                    case 's':
                        e.preventDefault();
                        this.exportICS();
                        break;
                }
            }
            
            if (!e.target.closest('input, textarea')) {
                switch (e.key) {
                    case 'ArrowLeft':
                        this.navigatePeriod(-1);
                        break;
                    case 'ArrowRight':
                        this.navigatePeriod(1);
                        break;
                    case 't':
                        this.goToToday();
                        break;
                    case 'm':
                        this.switchView('month');
                        break;
                    case 'w':
                        this.switchView('week');
                        break;
                    case 'd':
                        this.switchView('day');
                        break;
                    case 'y':
                        this.switchView('year');
                        break;
                }
            }
        });
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('calendar-theme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('calendar-theme', newTheme);
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Hide all views
        document.querySelectorAll('.calendar-view').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show current view
        document.getElementById(`${view}View`).classList.remove('hidden');
        
        this.renderCalendar();
    }
    
    navigatePeriod(direction) {
        switch (this.currentView) {
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + direction);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
                break;
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + direction);
                break;
            case 'year':
                this.currentDate.setFullYear(this.currentDate.getFullYear() + direction);
                break;
        }
        this.renderCalendar();
        this.updateMiniCalendar();
    }
    
    navigateMiniCalendar(direction) {
        const miniDate = new Date(this.currentDate);
        miniDate.setMonth(miniDate.getMonth() + direction);
        this.updateMiniCalendar(miniDate);
    }
    
    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
        this.updateMiniCalendar();
    }
    
    renderCalendar() {
        this.updatePeriodTitle();
        
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
        
        this.updateStatusBar();
    }
    
    updatePeriodTitle() {
        const title = document.getElementById('currentPeriod');
        
        switch (this.currentView) {
            case 'day':
                title.textContent = this.formatDate(this.currentDate, 'YYYY年MM月DD日');
                break;
            case 'week':
                const weekStart = this.getWeekStart(this.currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                title.textContent = `${this.formatDate(weekStart, 'MM/DD')} - ${this.formatDate(weekEnd, 'MM/DD')}`;
                break;
            case 'month':
                title.textContent = this.formatDate(this.currentDate, 'YYYY年MM月');
                break;
            case 'year':
                title.textContent = this.formatDate(this.currentDate, 'YYYY年');
                break;
        }
    }
    
    renderMonthView() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = this.getWeekStart(firstDay);
        
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayElement = this.createDayElement(date);
            grid.appendChild(dayElement);
        }
    }
    
    createDayElement(date) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.dataset.date = this.formatDate(date, 'YYYY-MM-DD');
        
        // Add classes
        if (this.isToday(date)) dayDiv.classList.add('today');
        if (date.getMonth() !== this.currentDate.getMonth()) dayDiv.classList.add('other-month');
        
        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayDiv.appendChild(dayNumber);
        
        // Events
        const eventsDiv = document.createElement('div');
        eventsDiv.className = 'day-events';
        
        const dayEvents = this.getEventsForDate(date);
        dayEvents.forEach(event => {
            const eventElement = this.createEventElement(event);
            eventsDiv.appendChild(eventElement);
        });
        
        dayDiv.appendChild(eventsDiv);
        
        // Event listeners
        dayDiv.addEventListener('click', () => {
            this.selectDate(date);
        });
        
        dayDiv.addEventListener('dblclick', () => {
            this.openQuickModal(date);
        });
        
        // Drag and drop
        dayDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            dayDiv.classList.add('drop-zone');
        });
        
        dayDiv.addEventListener('dragleave', () => {
            dayDiv.classList.remove('drop-zone');
        });
        
        dayDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            dayDiv.classList.remove('drop-zone');
            if (this.draggedEvent) {
                this.moveEvent(this.draggedEvent, date);
            }
        });
        
        return dayDiv;
    }
    
    createEventElement(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = `event-item event-${event.color}`;
        eventDiv.textContent = event.title;
        eventDiv.dataset.eventId = event.id;
        eventDiv.draggable = true;
        
        eventDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editingEvent = event;
            this.openEventModal(event);
        });
        
        eventDiv.addEventListener('dragstart', (e) => {
            this.draggedEvent = event;
            eventDiv.classList.add('dragging');
        });
        
        eventDiv.addEventListener('dragend', () => {
            eventDiv.classList.remove('dragging');
            this.draggedEvent = null;
        });
        
        return eventDiv;
    }
    
    renderWeekView() {
        const header = document.getElementById('weekHeader');
        const body = document.getElementById('weekBody');
        
        header.innerHTML = '<div></div>'; // Empty corner
        body.innerHTML = '';
        
        const weekStart = this.getWeekStart(this.currentDate);
        
        // Create headers
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'week-day-header';
            headerDiv.textContent = this.formatDate(date, 'MM/DD');
            header.appendChild(headerDiv);
        }
        
        // Create time slots and day columns
        for (let hour = 0; hour < 24; hour++) {
            // Time label
            const timeDiv = document.createElement('div');
            timeDiv.className = 'time-slot';
            timeDiv.textContent = `${hour.toString().padStart(2, '0')}:00`;
            body.appendChild(timeDiv);
            
            // Day columns
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + i);
                
                const columnDiv = document.createElement('div');
                columnDiv.className = 'week-day-column';
                columnDiv.dataset.date = this.formatDate(date, 'YYYY-MM-DD');
                columnDiv.dataset.hour = hour;
                
                columnDiv.addEventListener('click', () => {
                    this.openQuickModal(date, hour);
                });
                
                body.appendChild(columnDiv);
            }
        }
    }
    
    renderDayView() {
        const header = document.getElementById('dayHeader');
        const body = document.getElementById('dayBody');
        
        header.innerHTML = `<h2>${this.formatDate(this.currentDate, 'YYYY年MM月DD日')}</h2>`;
        body.innerHTML = '';
        
        for (let hour = 0; hour < 24; hour++) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'time-slot';
            timeDiv.textContent = `${hour.toString().padStart(2, '0')}:00`;
            body.appendChild(timeDiv);
            
            const eventsDiv = document.createElement('div');
            eventsDiv.className = 'day-hour-events';
            eventsDiv.dataset.hour = hour;
            
            eventsDiv.addEventListener('click', () => {
                this.openQuickModal(this.currentDate, hour);
            });
            
            body.appendChild(eventsDiv);
        }
    }
    
    renderYearView() {
        const grid = document.getElementById('yearGrid');
        grid.innerHTML = '';
        
        for (let month = 0; month < 12; month++) {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'year-month';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'year-month-header';
            headerDiv.textContent = `${month + 1}月`;
            monthDiv.appendChild(headerDiv);
            
            const monthGrid = document.createElement('div');
            monthGrid.className = 'year-month-grid';
            
            // Add weekday headers
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            weekdays.forEach(day => {
                const dayDiv = document.createElement('div');
                dayDiv.textContent = day;
                dayDiv.style.fontWeight = 'bold';
                dayDiv.style.fontSize = '10px';
                monthGrid.appendChild(dayDiv);
            });
            
            const firstDay = new Date(this.currentDate.getFullYear(), month, 1);
            const lastDay = new Date(this.currentDate.getFullYear(), month + 1, 0);
            const startDate = this.getWeekStart(firstDay);
            
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const dayDiv = document.createElement('div');
                dayDiv.className = 'year-day';
                dayDiv.textContent = date.getDate();
                
                if (this.isToday(date)) dayDiv.classList.add('today');
                if (date.getMonth() !== month) dayDiv.style.opacity = '0.3';
                
                dayDiv.addEventListener('click', () => {
                    this.currentDate = new Date(date);
                    this.switchView('month');
                });
                
                monthGrid.appendChild(dayDiv);
            }
            
            monthDiv.appendChild(monthGrid);
            grid.appendChild(monthDiv);
        }
    }
    
    updateMiniCalendar(date = this.currentDate) {
        const miniCalendar = document.getElementById('miniCalendar');
        const monthYear = document.getElementById('miniMonthYear');
        
        monthYear.textContent = this.formatDate(date, 'YYYY年MM月');
        miniCalendar.innerHTML = '';
        
        // Add weekday headers
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            dayDiv.style.fontWeight = 'bold';
            dayDiv.style.opacity = '0.7';
            miniCalendar.appendChild(dayDiv);
        });
        
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const startDate = this.getWeekStart(firstDay);
        
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'mini-day';
            dayDiv.textContent = currentDate.getDate();
            
            if (this.isToday(currentDate)) dayDiv.classList.add('today');
            if (currentDate.getMonth() !== date.getMonth()) dayDiv.classList.add('other-month');
            if (this.getEventsForDate(currentDate).length > 0) dayDiv.classList.add('has-events');
            
            dayDiv.addEventListener('click', () => {
                this.currentDate = new Date(currentDate);
                this.renderCalendar();
            });
            
            miniCalendar.appendChild(dayDiv);
        }
    }
    
    getEventsForDate(date) {
        const dateStr = this.formatDate(date, 'YYYY-MM-DD');
        
        return this.events.filter(event => {
            if (!this.passesFilters(event)) return false;
            
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate || event.startDate);
            
            return dateStr >= this.formatDate(eventStart, 'YYYY-MM-DD') && 
                   dateStr <= this.formatDate(eventEnd, 'YYYY-MM-DD');
        });
    }
    
    passesFilters(event) {
        // Search filter
        if (this.filters.search && !event.title.toLowerCase().includes(this.filters.search.toLowerCase())) {
            return false;
        }
        
        // Type filter
        if (this.filters.type && event.type !== this.filters.type) {
            return false;
        }
        
        // Color filter
        if (this.filters.colors.length > 0 && !this.filters.colors.includes(event.color)) {
            return false;
        }
        
        return true;
    }
    
    selectDate(date) {
        this.selectedDate = date;
        
        // Update visual selection
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        const selectedDay = document.querySelector(`[data-date="${this.formatDate(date, 'YYYY-MM-DD')}"]`);
        if (selectedDay) {
            selectedDay.classList.add('selected');
        }
        
        this.updateStatusBar();
    }
    
    openEventModal(event = null) {
        this.editingEvent = event;
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        
        // Reset form
        form.reset();
        
        if (event) {
            // Edit mode
            document.getElementById('modalTitle').textContent = '編輯行程';
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventStartDate').value = event.startDate;
            document.getElementById('eventEndDate').value = event.endDate || event.startDate;
            document.getElementById('eventStartTime').value = event.startTime || '';
            document.getElementById('eventEndTime').value = event.endTime || '';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventColor').value = event.color;
            document.getElementById('eventType').value = event.type || 'personal';
            document.getElementById('eventRepeat').value = event.repeat || 'none';
            document.getElementById('eventAllDay').checked = event.allDay || false;
            document.getElementById('deleteBtn').style.display = 'block';
        } else {
            // Add mode
            document.getElementById('modalTitle').textContent = '新增行程';
            if (this.selectedDate) {
                document.getElementById('eventStartDate').value = this.formatDate(this.selectedDate, 'YYYY-MM-DD');
                document.getElementById('eventEndDate').value = this.formatDate(this.selectedDate, 'YYYY-MM-DD');
            }
            document.getElementById('deleteBtn').style.display = 'none';
        }
        
        this.toggleTimeFields(document.getElementById('eventAllDay').checked);
        modal.classList.add('show');
        document.getElementById('eventTitle').focus();
    }
    
    closeEventModal() {
        document.getElementById('eventModal').classList.remove('show');
        this.editingEvent = null;
    }
    
    openQuickModal(date, hour = null) {
        this.selectedDate = date;
        const modal = document.getElementById('quickAddModal');
        modal.classList.add('show');
        document.getElementById('quickEventTitle').focus();
    }
    
    closeQuickModal() {
        document.getElementById('quickAddModal').classList.remove('show');
        document.getElementById('quickEventTitle').value = '';
    }
    
    toggleTimeFields(allDay) {
        const timeFields = [
            document.getElementById('eventStartTime'),
            document.getElementById('eventEndTime')
        ];
        
        timeFields.forEach(field => {
            field.disabled = allDay;
            field.style.opacity = allDay ? '0.5' : '1';
        });
    }
    
    saveEvent() {
        const form = document.getElementById('eventForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const eventData = {
            title: document.getElementById('eventTitle').value,
            startDate: document.getElementById('eventStartDate').value,
            endDate: document.getElementById('eventEndDate').value,
            startTime: document.getElementById('eventStartTime').value,
            endTime: document.getElementById('eventEndTime').value,
            description: document.getElementById('eventDescription').value,
            color: document.getElementById('eventColor').value,
            type: document.getElementById('eventType').value,
            repeat: document.getElementById('eventRepeat').value,
            allDay: document.getElementById('eventAllDay').checked
        };
        
        if (this.editingEvent) {
            // Update existing event
            Object.assign(this.editingEvent, eventData);
        } else {
            // Create new event
            eventData.id = this.generateId();
            this.events.push(eventData);
            
            // Handle repeat events
            this.createRepeatEvents(eventData);
        }
        
        this.saveEvents();
        this.renderCalendar();
        this.updateMiniCalendar();
        this.closeEventModal();
    }
    
    saveQuickEvent() {
        const title = document.getElementById('quickEventTitle').value.trim();
        if (!title) return;
        
        const event = {
            id: this.generateId(),
            title: title,
            startDate: this.formatDate(this.selectedDate, 'YYYY-MM-DD'),
            endDate: this.formatDate(this.selectedDate, 'YYYY-MM-DD'),
            allDay: true,
            color: 'blue',
            type: 'personal',
            repeat: 'none'
        };
        
        this.events.push(event);
        this.saveEvents();
        this.renderCalendar();
        this.updateMiniCalendar();
        this.closeQuickModal();
    }
    
    createRepeatEvents(baseEvent) {
        if (baseEvent.repeat === 'none') return;
        
        const startDate = new Date(baseEvent.startDate);
        const repeatCount = 10; // Create 10 repeat instances
        
        for (let i = 1; i <= repeatCount; i++) {
            const newDate = new Date(startDate);
            
            switch (baseEvent.repeat) {
                case 'daily':
                    newDate.setDate(startDate.getDate() + i);
                    break;
                case 'weekly':
                    newDate.setDate(startDate.getDate() + (i * 7));
                    break;
                case 'monthly':
                    newDate.setMonth(startDate.getMonth() + i);
                    break;
                case 'yearly':
                    newDate.setFullYear(startDate.getFullYear() + i);
                    break;
            }
            
            const repeatEvent = {
                ...baseEvent,
                id: this.generateId(),
                startDate: this.formatDate(newDate, 'YYYY-MM-DD'),
                endDate: this.formatDate(newDate, 'YYYY-MM-DD'),
                parentId: baseEvent.id
            };
            
            this.events.push(repeatEvent);
        }
    }
    
    deleteEvent() {
        if (this.editingEvent) {
            this.events = this.events.filter(event => event.id !== this.editingEvent.id);
            
            // Also delete related repeat events
            if (this.editingEvent.repeat !== 'none') {
                this.events = this.events.filter(event => event.parentId !== this.editingEvent.id);
            }
            
            this.saveEvents();
            this.renderCalendar();
            this.updateMiniCalendar();
            this.closeEventModal();
        }
    }
    
    moveEvent(event, newDate) {
        event.startDate = this.formatDate(newDate, 'YYYY-MM-DD');
        if (!event.endDate || event.endDate === event.startDate) {
            event.endDate = this.formatDate(newDate, 'YYYY-MM-DD');
        }
        
        this.saveEvents();
        this.renderCalendar();
    }
    
    showContextMenu(e, eventElement) {
        const menu = document.getElementById('contextMenu');
        const eventId = eventElement.dataset.eventId;
        this.contextEvent = this.events.find(event => event.id === eventId);
        
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.classList.add('show');
    }
    
    hideContextMenu() {
        document.getElementById('contextMenu').classList.remove('show');
        this.contextEvent = null;
    }
    
    editContextEvent() {
        if (this.contextEvent) {
            this.openEventModal(this.contextEvent);
        }
        this.hideContextMenu();
    }
    
    deleteContextEvent() {
        if (this.contextEvent) {
            this.events = this.events.filter(event => event.id !== this.contextEvent.id);
            this.saveEvents();
            this.renderCalendar();
            this.updateMiniCalendar();
        }
        this.hideContextMenu();
    }
    
    duplicateContextEvent() {
        if (this.contextEvent) {
            const newEvent = {
                ...this.contextEvent,
                id: this.generateId(),
                title: this.contextEvent.title + ' (複製)'
            };
            this.events.push(newEvent);
            this.saveEvents();
            this.renderCalendar();
        }
        this.hideContextMenu();
    }
    
    exportICS() {
        let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//行程管理工具//行程管理工具 1.0//EN\n';
        
        this.events.forEach(event => {
            icsContent += 'BEGIN:VEVENT\n';
            icsContent += `UID:${event.id}\n`;
            icsContent += `SUMMARY:${event.title}\n`;
            icsContent += `DTSTART:${event.startDate.replace(/-/g, '')}\n`;
            icsContent += `DTEND:${(event.endDate || event.startDate).replace(/-/g, '')}\n`;
            if (event.description) {
                icsContent += `DESCRIPTION:${event.description}\n`;
            }
            icsContent += 'END:VEVENT\n';
        });
        
        icsContent += 'END:VCALENDAR';
        
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendar-${this.formatDate(new Date(), 'YYYY-MM-DD')}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importICS(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.parseICS(content);
        };
        reader.readAsText(file);
    }
    
    parseICS(content) {
        const lines = content.split('\n');
        let currentEvent = null;
        
        lines.forEach(line => {
            line = line.trim();
            
            if (line === 'BEGIN:VEVENT') {
                currentEvent = { id: this.generateId(), allDay: true, color: 'blue', type: 'personal', repeat: 'none' };
            } else if (line === 'END:VEVENT' && currentEvent) {
                this.events.push(currentEvent);
                currentEvent = null;
            } else if (currentEvent) {
                const [key, value] = line.split(':');
                switch (key) {
                    case 'SUMMARY':
                        currentEvent.title = value;
                        break;
                    case 'DTSTART':
                        currentEvent.startDate = this.formatICSDate(value);
                        break;
                    case 'DTEND':
                        currentEvent.endDate = this.formatICSDate(value);
                        break;
                    case 'DESCRIPTION':
                        currentEvent.description = value;
                        break;
                }
            }
        });
        
        this.saveEvents();
        this.renderCalendar();
        this.updateMiniCalendar();
    }
    
    formatICSDate(icsDate) {
        // Convert YYYYMMDD to YYYY-MM-DD
        return icsDate.substring(0, 4) + '-' + icsDate.substring(4, 6) + '-' + icsDate.substring(6, 8);
    }
    
    backupData() {
        const data = {
            events: this.events,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendar-backup-${this.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.events = data.events || [];
                        this.saveEvents();
                        this.renderCalendar();
                        this.updateMiniCalendar();
                        alert('資料已成功還原！');
                    } catch (error) {
                        alert('無效的備份檔案！');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    updateStatusBar() {
        const eventCount = document.getElementById('eventCount');
        const selectedDateEl = document.getElementById('selectedDate');
        
        const filteredEvents = this.events.filter(event => this.passesFilters(event));
        eventCount.textContent = `${filteredEvents.length} 個事件`;
        
        if (this.selectedDate) {
            selectedDateEl.textContent = this.formatDate(this.selectedDate, 'YYYY年MM月DD日');
        } else {
            selectedDateEl.textContent = '';
        }
    }
    
    // Utility functions
    formatDate(date, format) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }
    
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }
    
    getWeekStart(date) {
        const start = new Date(date);
        const day = start.getDay();
        start.setDate(start.getDate() - day);
        return start;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CalendarApp();
});