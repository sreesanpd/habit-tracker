// State Management
let habits = JSON.parse(localStorage.getItem('aura_habits')) || [
    { id: '1', title: 'Drink water', color: 'teal', icon: '💧', history: {}, streak: 0, createdAt: new Date().getTime() - 10*24*60*60*1000 },
    { id: '2', title: 'Read a book', color: 'purple', icon: '📚', history: {}, streak: 0, createdAt: new Date().getTime() - 10*24*60*60*1000 },
    { id: '3', title: 'Morning jog', color: 'rose', icon: '🏃', history: {}, streak: 0, createdAt: new Date().getTime() - 10*24*60*60*1000 }
];

let selectedDate = new Date();
selectedDate.setHours(0, 0, 0, 0);

// Colors mapping
const themeColors = {
    teal: '#14b8a6',
    purple: '#a855f7',
    rose: '#f43f5e',
    amber: '#f59e0b',
    blue: '#3b82f6',
    green: '#10b981',
    orange: '#f97316',
    pink: '#ec4899'
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkUrlImport();
    initDateHeader();
    renderWeekStrip();
    renderHabits();
    setupFormListeners();
    updateStats();
});

// Check if loaded with a sync/import URL
function checkUrlImport() {
    if (window.location.hash.startsWith('#import=')) {
        try {
            const hashData = window.location.hash.substring(8);
            const importedData = decompressData(hashData);
            if (Array.isArray(importedData)) {
                const isValid = importedData.every(h => h.id && h.title && h.history);
                if (isValid) {
                    if (confirm("Import habits from sync link? This will overwrite your current daily checklist and history.")) {
                        habits = importedData;
                        saveToStorage();
                    }
                } else {
                    alert("Sync link has an invalid data structure.");
                }
            } else {
                alert("Invalid sync link format.");
            }
        } catch (e) {
            console.error("Sync import failed:", e);
        }
        // Clear hash from URL so it doesn't prompt again
        history.replaceState("", document.title, window.location.pathname + window.location.search);
    }
}

// Setup date display in Header
function initDateHeader() {
    const optionsDay = { weekday: 'long' };
    const optionsDate = { month: 'short', day: 'numeric' };
    
    document.getElementById('current-day').innerText = selectedDate.toLocaleDateString('en-US', optionsDay);
    document.getElementById('current-date').innerText = selectedDate.toLocaleDateString('en-US', optionsDate);
}

// Generate the 7 days week strip
function renderWeekStrip() {
    const weekStrip = document.getElementById('week-strip');
    weekStrip.innerHTML = '';
    
    // Get start of current week (Monday)
    const today = new Date(selectedDate);
    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(today.setDate(today.getDate() + distanceToMonday));
    
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        currentDate.setHours(0,0,0,0);
        
        const realToday = new Date();
        realToday.setHours(0,0,0,0);
        const isFuture = currentDate > realToday;
        const isSelected = currentDate.getTime() === selectedDate.getTime();
        const dateStr = formatDateKey(currentDate);
        
        const dayItem = document.createElement('div');
        dayItem.className = `day-item ${isSelected ? 'active' : ''}`;
        
        if (!isFuture) {
            dayItem.onclick = () => {
                selectedDate = currentDate;
                initDateHeader();
                renderWeekStrip();
                renderHabits();
            };
        } else {
            dayItem.style.opacity = '0.35';
            dayItem.style.cursor = 'not-allowed';
            dayItem.title = "Future date";
        }
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        dayItem.innerHTML = `
            <span class="day-name">${dayNames[currentDate.getDay()]}</span>
            <span class="day-number">${currentDate.getDate()}</span>
        `;
        
        weekStrip.appendChild(dayItem);
    }
}

// Change week view offset
function changeWeek(offset) {
    selectedDate.setDate(selectedDate.getDate() + (offset * 7));
    initDateHeader();
    renderWeekStrip();
    renderHabits();
}

// Helper: Format Date key for storage: YYYY-MM-DD
function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Helper: Format Streak display beautifully (years if >= 365 days)
function formatStreakText(days) {
    if (days >= 365) {
        const years = Math.floor(days / 365);
        const remainingDays = days % 365;
        if (remainingDays === 0) {
            return `👑 ${years} year${years > 1 ? 's' : ''}`;
        }
        return `👑 ${years}y ${remainingDays}d`;
    }
    return `⚡ ${days}d`;
}

// Helper: Calculate creation date and total check-ins
function getHabitStatsInfo(habit) {
    const todayKey = formatDateKey(new Date());
    const totalCompletions = Object.keys(habit.history).filter(d => d <= todayKey).length;
    
    let creationTime = habit.createdAt || new Date().getTime();
    
    // Check if there is an earlier check-in date in history
    const keys = Object.keys(habit.history).sort();
    if (keys.length > 0) {
        const parts = keys[0].split('-');
        const earliestCheckIn = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
        if (earliestCheckIn < creationTime) {
            creationTime = earliestCheckIn;
        }
    }
    
    const creationDate = new Date(creationTime);
    const dateFormatted = creationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Calculate best streak
    const best = calculateBestStreak(habit);
    
    return {
        total: totalCompletions,
        since: dateFormatted,
        best: best
    };
}

function calculateBestStreak(habit) {
    const todayKey = formatDateKey(new Date());
    const dates = Object.keys(habit.history)
        .filter(d => d <= todayKey)
        .sort((a, b) => {
            return new Date(a).getTime() - new Date(b).getTime();
        });
    if (dates.length === 0) return 0;
    
    let best = 0;
    let current = 0;
    let expectedDate = null;
    
    dates.forEach(dateStr => {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return;
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        d.setHours(0, 0, 0, 0);
        
        if (expectedDate === null) {
            current = 1;
        } else {
            const diffTime = d.getTime() - expectedDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                current++;
            } else if (diffDays > 1 || diffDays < 0) {
                if (current > best) best = current;
                current = 1;
            }
        }
        expectedDate = d;
    });
    
    if (current > best) best = current;
    console.log(`[Streak Debug] Habit: "${habit.title}" | Keys: ${Object.keys(habit.history).join(", ")} | Sorted: ${dates.join(", ")} | Calculated Best Streak: ${best}d`);
    return best;
}

// Render habits list for the selected day
function renderHabits() {
    const listContainer = document.getElementById('habits-list');
    listContainer.innerHTML = '';
    
    const dateKey = formatDateKey(selectedDate);
    
    const activeHabits = habits.filter(h => !h.archived);
    
    if (activeHabits.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✨</div>
                <div class="empty-state-title">No active habits</div>
                <div style="font-size: 13px;">Tap the + button to build your daily routine!</div>
            </div>
        `;
        document.getElementById('habit-progress-summary').innerText = '0 of 0 completed';
        return;
    }
    
    let completedCount = 0;
    
    activeHabits.forEach(habit => {
        const isChecked = !!habit.history[dateKey];
        if (isChecked) completedCount++;
        
        // Calculate dynamic streak
        const streak = calculateStreak(habit);
        habit.streak = streak;
        
        const card = document.createElement('div');
        card.className = `habit-card ${habit.color} ${isChecked ? 'checked' : ''}`;
        
        card.innerHTML = `
            <div class="habit-info" onclick="toggleHabit('${habit.id}')">
                <div class="habit-icon-wrapper">
                    ${habit.icon}
                </div>
                <div class="habit-details">
                    <span class="habit-title">${habit.title}</span>
                    <div class="habit-stats-row">
                        <span class="habit-streak">${formatStreakText(streak)}</span>
                    </div>
                </div>
            </div>
            <button class="check-btn" onclick="toggleHabit('${habit.id}')"></button>
        `;
        
        listContainer.appendChild(card);
    });
    
    document.getElementById('habit-progress-summary').innerText = `${completedCount} of ${activeHabits.length} completed`;
    saveToStorage();
}

// Toggle habit complete / incomplete
function toggleHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    
    const dateKey = formatDateKey(selectedDate);
    
    if (habit.history[dateKey]) {
        delete habit.history[dateKey];
    } else {
        habit.history[dateKey] = true;
        showToast();
    }
    
    renderHabits();
    updateStats();
}

// Show satisfied toast completion
function showToast() {
    const toast = document.getElementById('toast');
    toast.className = "toast show";
    setTimeout(() => {
        toast.className = "toast";
    }, 2000);
}

// Modal management
function openModal() {
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal(event) {
    document.getElementById('modal-overlay').classList.remove('active');
}

// Form logic and selection setup
function setupFormListeners() {
    // Selection listeners
    const colorOpts = document.querySelectorAll('.color-option');
    colorOpts.forEach(opt => {
        opt.onclick = () => {
            colorOpts.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
        };
    });
    
    const iconOpts = document.querySelectorAll('.icon-option');
    iconOpts.forEach(opt => {
        opt.onclick = () => {
            iconOpts.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
        };
    });
}

function createNewHabit(event) {
    event.preventDefault();
    
    const titleInput = document.getElementById('habit-name');
    const title = titleInput.value.trim();
    if (!title) return;
    
    const colorOpt = document.querySelector('.color-option.selected');
    const color = colorOpt ? colorOpt.getAttribute('data-color') : 'teal';
    
    const iconOpt = document.querySelector('.icon-option.selected');
    const icon = iconOpt ? iconOpt.getAttribute('data-icon') : '💧';
    
    const newHabit = {
        id: Date.now().toString(),
        title,
        color,
        icon,
        history: {},
        streak: 0,
        createdAt: Date.now()
    };
    
    habits.push(newHabit);
    
    // Clear & Close
    titleInput.value = '';
    closeModal();
    renderHabits();
    updateStats();
    renderManageScreen();
}

function deleteHabit(event, id) {
    event.stopPropagation();
    const habit = habits.find(h => h.id === id);
    const title = habit ? habit.title : 'this habit';
    
    if (confirm(`Are you sure you want to delete "${title}"? This will erase all its logged history and streaks.`)) {
        habits = habits.filter(h => h.id !== id);
        renderHabits();
        updateStats();
        renderManageScreen();
    }
}

function archiveHabit(event, id) {
    event.stopPropagation();
    const habit = habits.find(h => h.id === id);
    const title = habit ? habit.title : 'this habit';
    
    if (confirm(`Archive "${title}"? It will be hidden from the daily checklist but keep all its statistics.`)) {
        habit.archived = true;
        renderHabits();
        updateStats();
        renderManageScreen();
    }
}

function unarchiveHabit(event, id) {
    event.stopPropagation();
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    
    habit.archived = false;
    renderHabits();
    updateStats();
    renderManageScreen();
}

function calculateStreak(habit) {
    const todayKey = formatDateKey(new Date());
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0,0,0,0);
    
    // If not completed today, check yesterday as starting point for active streak
    let dateKey = formatDateKey(checkDate);
    if (!habit.history[dateKey]) {
        checkDate.setDate(checkDate.getDate() - 1);
        dateKey = formatDateKey(checkDate);
    }
    
    while (habit.history[dateKey] && dateKey <= todayKey) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        dateKey = formatDateKey(checkDate);
    }
    
    return currentStreak;
}

// Tab switcher today / stats
function switchTab(tab) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(n => n.classList.remove('active'));
    
    if (tab === 'today') {
        document.getElementById('screen-today').classList.add('active');
        navItems[0].classList.add('active');
        renderWeekStrip();
        renderHabits();
    } else if (tab === 'stats') {
        document.getElementById('screen-stats').classList.add('active');
        navItems[1].classList.add('active');
        updateStats();
    } else if (tab === 'manage') {
        document.getElementById('screen-manage').classList.add('active');
        navItems[2].classList.add('active');
        renderManageScreen();
    }
}

// Persistence
function saveToStorage() {
    localStorage.setItem('aura_habits', JSON.stringify(habits));
}

// Stats & Interactive Chart rendering
function updateStats() {
    if (habits.length === 0) {
        document.getElementById('stat-completion').innerText = '0%';
        document.getElementById('stat-streak').innerText = '0';
        document.getElementById('stats-habit-streaks').innerHTML = '';
        drawChart([]);
        return;
    }
    
    // Completion rate for today
    const todayKey = formatDateKey(new Date());
    const completedToday = habits.filter(h => h.history[todayKey]).length;
    const rate = Math.round((completedToday / habits.length) * 100);
    document.getElementById('stat-completion').innerText = `${rate}%`;
    
    // Best streak
    const bestStreak = Math.max(...habits.map(h => calculateBestStreak(h)));
    document.getElementById('stat-streak').innerText = bestStreak >= 365 ? formatStreakText(bestStreak).replace('👑 ', '') : bestStreak;
    
    // Streak breakdown details
    const listContainer = document.getElementById('stats-habit-streaks');
    listContainer.innerHTML = '';
    const activeHabits = habits.filter(h => !h.archived);
    const archivedHabits = habits.filter(h => h.archived);

    activeHabits.forEach(h => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.padding = '12px 16px';
        item.style.borderRadius = '12px';
        item.style.background = 'rgba(255,255,255,0.02)';
        item.style.marginBottom = '8px';
        item.style.border = '1px solid var(--border-color)';
        
        const statsInfo = getHabitStatsInfo(h);
        
        item.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${h.icon}</span>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 500;">${h.title}</span>
                            <span style="font-size: 11px; color: var(--text-muted);">Since ${statsInfo.since} • ${statsInfo.total} check-in${statsInfo.total !== 1 ? 's' : ''} • Best: ${statsInfo.best}d</span>
                        </div>
                    </div>
                    <span style="color: var(--accent-teal); font-weight: 600;">${formatStreakText(h.streak)}</span>
                </div>
                <div class="habit-heatmap-grid" id="heatmap-${h.id}"></div>
            </div>
        `;
        listContainer.appendChild(item);
        renderMiniHeatmap(h);
    });


    
    // Calculate weekly data (last 7 days completion rate)
    const weekData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = formatDateKey(d);
        const completed = habits.filter(h => h.history[key]).length;
        const compRate = Math.round((completed / habits.length) * 100);
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekData.push({
            label: days[d.getDay()],
            value: compRate
        });
    }
    
    // Update date label range
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - 6);
    const options = { month: 'short', day: 'numeric' };
    document.getElementById('chart-week-range').innerText = `${firstDay.toLocaleDateString('en-US', options)} - ${today.toLocaleDateString('en-US', options)}`;
    
    drawChart(weekData);
}

// Generate the 15-week Git-style consistency heatmap for a specific habit
function renderMiniHeatmap(habit) {
    const grid = document.getElementById(`heatmap-${habit.id}`);
    if (!grid) return;
    grid.innerHTML = '';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Align start to the Monday of 15 weeks ago
    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + distanceToMonday);
    
    const startMonday = new Date(currentMonday);
    startMonday.setDate(currentMonday.getDate() - (14 * 7));
    
    for (let dayOffset = 0; dayOffset < 15 * 7; dayOffset++) {
        const currentDate = new Date(startMonday);
        currentDate.setDate(startMonday.getDate() + dayOffset);
        
        const dateKey = formatDateKey(currentDate);
        const sq = document.createElement('div');
        sq.className = 'habit-square';
        
        const displayDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const isCompleted = !!habit.history[dateKey] && currentDate <= today;
        if (isCompleted) {
            sq.className = `habit-square ${habit.color} active`;
        }
        sq.title = `${displayDate}: ${currentDate > today ? 'Future' : (isCompleted ? 'Completed' : 'Not completed')}`;
        
        if (currentDate > today) {
            sq.style.opacity = '0.15';
        }
        
        grid.appendChild(sq);
    }
}

// Drawing custom gorgeous chart using HTML5 Canvas
function drawChart(data) {
    const canvas = document.getElementById('weekly-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear and adjust resolution
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;
    
    // Draw horizontal grid lines and scale
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Outfit';
    
    for (let i = 0; i <= 4; i++) {
        const y = padding + (i * (height - 2 * padding) / 4);
        const val = 100 - (i * 25);
        ctx.fillText(val + '%', 5, y + 3);
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(width - 10, y);
        ctx.stroke();
    }
    
    if (data.length === 0) return;
    
    // Plot points
    const points = [];
    const graphWidth = width - 45;
    const stepX = graphWidth / 6;
    
    data.forEach((item, idx) => {
        const x = 35 + (idx * stepX);
        // Map rate 0-100% to canvas height coordinate
        const usableHeight = height - 2 * padding;
        const y = padding + usableHeight - (item.value / 100 * usableHeight);
        points.push({ x, y, label: item.label });
    });
    
    // Draw Area gradient under line
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);
    points.forEach(pt => {
        ctx.lineTo(pt.x, pt.y);
    });
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.closePath();
    
    const areaGrad = ctx.createLinearGradient(0, padding, 0, height - padding);
    areaGrad.addColorStop(0, 'rgba(20, 184, 166, 0.2)');
    areaGrad.addColorStop(1, 'rgba(20, 184, 166, 0.0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();
    
    // Draw Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw points & labels
    points.forEach(pt => {
        // Outer dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#14b8a6';
        ctx.fill();
        
        // Inner dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // X Labels
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(pt.label, pt.x, height - 10);
    });
}

// Render Manage Habit view list
function renderManageScreen() {
    const activeList = document.getElementById('manage-active-list');
    const archivedList = document.getElementById('manage-archived-list');
    const archivedTitle = document.getElementById('manage-archived-title');
    
    if (!activeList || !archivedList) return;
    
    activeList.innerHTML = '';
    archivedList.innerHTML = '';
    
    const activeHabits = habits.filter(h => !h.archived);
    const archivedHabits = habits.filter(h => h.archived);
    
    if (activeHabits.length === 0) {
        activeList.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 30px 0; font-size: 14px;">
                No active habits. Create one above!
            </div>
        `;
    } else {
        activeHabits.forEach(h => {
            const card = document.createElement('div');
            card.className = `habit-card ${h.color}`;
            card.style.cursor = 'default';
            
            card.innerHTML = `
                <div class="habit-info">
                    <div class="habit-icon-wrapper">
                        ${h.icon}
                    </div>
                    <div class="habit-details">
                        <span class="habit-title">${h.title}</span>
                        <div class="habit-stats-row">
                            <span>⚡ Streak: ${h.streak}d</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="week-nav-btn" style="width: auto; padding: 0 12px; font-size: 12px;" onclick="archiveHabit(event, '${h.id}')">Archive</button>
                    <button class="week-nav-btn" style="width: auto; padding: 0 12px; font-size: 12px; color: var(--accent-rose); border-color: rgba(244, 63, 94, 0.2);" onclick="deleteHabit(event, '${h.id}')">Delete</button>
                </div>
            `;
            activeList.appendChild(card);
        });
    }
    
    if (archivedHabits.length === 0) {
        archivedTitle.style.display = 'none';
        archivedList.style.display = 'none';
    } else {
        archivedTitle.style.display = 'block';
        archivedList.style.display = 'block';
        archivedHabits.forEach(h => {
            const card = document.createElement('div');
            card.className = `habit-card ${h.color}`;
            card.style.opacity = '0.75';
            card.style.cursor = 'default';
            
            card.innerHTML = `
                <div class="habit-info">
                    <div class="habit-icon-wrapper" style="background: rgba(255,255,255,0.03); color: var(--text-muted);">
                        ${h.icon}
                    </div>
                    <div class="habit-details">
                        <span class="habit-title" style="text-decoration: line-through; color: var(--text-secondary);">${h.title}</span>
                        <div class="habit-stats-row">
                            <span>Archived</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="week-nav-btn" style="width: auto; padding: 0 12px; font-size: 12px; color: var(--accent-teal); border-color: rgba(20, 184, 166, 0.2);" onclick="unarchiveHabit(event, '${h.id}')">Restore</button>
                    <button class="week-nav-btn" style="width: auto; padding: 0 12px; font-size: 12px; color: var(--accent-rose); border-color: rgba(244, 63, 94, 0.2);" onclick="deleteHabit(event, '${h.id}')">Delete</button>
                </div>
            `;
            archivedList.appendChild(card);
        });
    }
}

// Export data to a JSON file
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(habits));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aurahabit-backup-${formatDateKey(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// Trigger hidden file input click
function triggerImport() {
    document.getElementById('import-file').click();
}

// Import data from selected JSON file
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedHabits = JSON.parse(e.target.result);
            if (Array.isArray(importedHabits)) {
                const isValid = importedHabits.every(h => h.id && h.title && h.history);
                if (isValid) {
                    if (confirm("Importing will overwrite your current habits and histories. Do you want to proceed?")) {
                        habits = importedHabits;
                        saveToStorage();
                        renderHabits();
                        updateStats();
                        renderManageScreen();
                        alert("Data successfully restored! 🎉");
                    }
                } else {
                    alert("Invalid backup file structure.");
                }
            } else {
                alert("Invalid backup format.");
            }
        } catch (err) {
            alert("Error parsing backup file.");
        }
    };
    reader.readAsText(file);
}

const BASE_DATE_TIME = new Date(2026, 0, 1).getTime();

// Compress data safely to unicode-safe base64 using relative day offsets
function compressData(data) {
    try {
        const compressedList = data.map(h => {
            const offsets = Object.keys(h.history).map(dateStr => {
                const parts = dateStr.split('-');
                const d = new Date(parts[0], parts[1] - 1, parts[2]);
                return Math.round((d.getTime() - BASE_DATE_TIME) / (1000 * 60 * 60 * 24));
            });
            return [
                h.id,
                h.title,
                h.color,
                h.icon,
                h.createdAt || Date.now(),
                offsets,
                h.archived ? 1 : 0
            ];
        });
        const jsonStr = JSON.stringify(compressedList);
        return btoa(encodeURIComponent(jsonStr));
    } catch (e) {
        console.error("Compression error:", e);
        return null;
    }
}

// Decompress base64 to JSON habits
function decompressData(str) {
    try {
        let cleanStr = str.trim();
        
        // 1. If it contains a URL with import hash, extract the hash value
        if (cleanStr.includes('#import=')) {
            cleanStr = cleanStr.split('#import=')[1].split('&')[0];
        } else if (cleanStr.includes('import=')) {
            cleanStr = cleanStr.split('import=')[1].split('&')[0];
        }

        // 2. Extract the longest contiguous base64-like sequence to filter out surrounding instructions/text
        const base64Regex = /[A-Za-z0-9+/=]{15,}/g;
        const matches = cleanStr.match(base64Regex);
        if (matches && matches.length > 0) {
            let longestMatch = matches[0];
            for (let i = 1; i < matches.length; i++) {
                if (matches[i].length > longestMatch.length) {
                    longestMatch = matches[i];
                }
            }
            cleanStr = longestMatch;
        }

        const decoded = decodeURIComponent(atob(cleanStr));
        const compressedList = JSON.parse(decoded);
        return compressedList.map(c => {
            const history = {};
            const offsets = c[5] || [];
            offsets.forEach(offset => {
                const d = new Date(BASE_DATE_TIME + offset * (1000 * 60 * 60 * 24));
                const key = formatDateKey(d);
                history[key] = true;
            });
            return {
                id: c[0],
                title: c[1],
                color: c[2],
                icon: c[3],
                createdAt: c[4],
                history: history,
                streak: 0,
                archived: c[6] === 1
            };
        });
    } catch (e) {
        console.error("Decompression error:", e);
        return null;
    }
}

// Generate the unique sharing sync URL
function getSyncUrl() {
    return window.location.origin + window.location.pathname + "#import=" + compressData(habits);
}

// Copy sharing link to clipboard
function copySyncLink() {
    const syncUrl = getSyncUrl();
    const code = compressData(habits);
    const clipText = `Sync my AuraHabit:\n${syncUrl}\n\nFor iOS standalone PWA, copy & paste this Sync Code:\n${code}`;
    navigator.clipboard.writeText(clipText).then(() => {
        alert("Sync details copied! Send them to your other phone. 📋");
    }).catch(err => {
        navigator.clipboard.writeText(syncUrl).then(() => {
            alert("Sync link copied! (PWA sync code copy failed, but link is copied)");
        }).catch(() => {
            alert("Failed to copy link.");
        });
    });
}

// Open WhatsApp to send sync link to yourself
function shareWhatsApp() {
    const syncUrl = getSyncUrl();
    const code = compressData(habits);
    const textMsg = `Sync my AuraHabit:\n${syncUrl}\n\nFor iOS standalone PWA, copy & paste this Sync Code:\n${code}`;
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(textMsg), "_blank");
}

// Copy sync code only (Base64) to clipboard
function copySyncCode() {
    const code = compressData(habits);
    if (!code) {
        alert("Failed to generate sync code.");
        return;
    }
    navigator.clipboard.writeText(code).then(() => {
        alert("Sync code copied to clipboard! Paste it on your other device. 📋");
    }).catch(err => {
        alert("Failed to copy code. Please copy manually.");
    });
}

// Import sync code manually from input
function importSyncCode() {
    const input = document.getElementById('sync-code-input');
    const code = input ? input.value.trim() : '';
    if (!code) {
        alert("Please paste a sync code first.");
        return;
    }
    const importedData = decompressData(code);
    if (Array.isArray(importedData)) {
        const isValid = importedData.every(h => h.id && h.title && h.history);
        if (isValid) {
            if (confirm("Import habits from sync code? This will overwrite your current daily checklist and history.")) {
                habits = importedData;
                saveToStorage();
                renderHabits();
                updateStats();
                renderManageScreen();
                if (input) input.value = '';
                alert("Data successfully synced! 🎉");
            }
        } else {
            alert("Sync code has an invalid data structure.");
        }
    } else {
        alert("Invalid sync code format. Make sure you copied the entire code.");
    }
}
