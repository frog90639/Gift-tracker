<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gift Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/xlsx@latest/dist/xlsx.full.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        :root {
            --color-bg: #F7F7F8;
            --color-surface: #FFFFFF;
            --color-primary: #6C5CE7;
            --color-primary-text: #FFFFFF;
            --color-secondary: #F0EEFB;
            --color-accent: #6C5CE7;
            --color-text: #1A1D1F;
            --color-text-muted: #6F7378;
            --color-border: #E7E8EA;
            --color-success: #12B76A;
            --color-warning: #F79009;
            --color-error: #E5484D;
        }
        * { font-family: 'Inter', sans-serif; }
        body { background-color: var(--color-bg); }
        button, .swipe-edit, .swipe-delete { border-radius: 8px; }
        h1, h2, h3 { letter-spacing: -0.01em; }

        /* Card elevation — replaces flat borders with a subtle shadow so cards lift off the background */
        .swipe-item-content.rounded-lg.border,
        .swipe-item-content.rounded-lg.p-4 {
            border-radius: 12px !important;
            border-color: transparent !important;
            box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.06);
            transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .swipe-item-content.rounded-lg.border:hover,
        .swipe-item-content.rounded-lg.p-4:hover {
            box-shadow: 0 2px 6px rgba(16, 24, 40, 0.08), 0 1px 3px rgba(16, 24, 40, 0.06);
        }
        .swipe-item { margin-bottom: 12px !important; }

        /* Sticky header — soft shadow instead of a hard border line, gives real depth */
        .sticky.top-0.z-50 {
            box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
            border-bottom: none !important;
        }

        /* Tab bar as a segmented control instead of plain underlined text links */
        .max-w-4xl.mx-auto.px-4.flex.gap-2.border-t.overflow-x-auto {
            border-top: none !important;
            background-color: var(--color-bg);
            padding-top: 10px !important;
            padding-bottom: 10px !important;
            gap: 4px !important;
        }
        .max-w-4xl.mx-auto.px-4.flex.gap-2.border-t.overflow-x-auto button {
            border-radius: 8px !important;
            border-bottom: none !important;
            padding-top: 8px !important;
            padding-bottom: 8px !important;
        }
        .max-w-4xl.mx-auto.px-4.flex.gap-2.border-t.overflow-x-auto button[style*="var(--color-primary)"] {
            background-color: var(--color-secondary);
        }
        .swipe-item { position: relative; overflow: hidden; }
        .swipe-item-content { display: flex; transition: transform 0.3s ease-out; touch-action: pan-y; }
        .swipe-item.swiped-right .swipe-item-content { transform: translateX(60px); }
        .swipe-item.swiped-right .swipe-item-content { transform: translateX(60px); }
        .swipe-item.swiped-left .swipe-item-content { transform: translateX(calc(0px - 60px)); }
        .swipe-delete { position: absolute; right: 0; top: 0; bottom: 0; width: 60px; background-color: var(--color-error); display: none; align-items: center; justify-content: center; color: white; cursor: pointer; }
        .swipe-item.swiped-left .swipe-delete { display: flex; }
        .swipe-edit { position: absolute; left: 0; top: 0; bottom: 0; width: 60px; background-color: var(--color-accent); display: none; align-items: center; justify-content: center; color: white; cursor: pointer; z-index: 10; pointer-events: auto; }
        .swipe-item.swiped-right .swipe-edit { display: flex; }
    </style>
</head>
<body>
    <div id="app">Loading...</div>
    <script>
// Replace the native browser alert() with a styled modal that matches the app's
// design, so every existing alert(...) call site (there are many) gets the new
// look automatically with no changes needed at each call site.
window.alert = function(message) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;';
    const dialog = document.createElement('div');
    dialog.style.cssText = "background: white; border-radius: 12px; padding: 24px; width: 90%; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: 'Poppins', sans-serif;";
    const safeMessage = String(message).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    dialog.innerHTML = '<p style="color: #2D3436; margin-bottom: 20px; white-space: pre-line; line-height: 1.5;">' + safeMessage + '</p><div style="text-align: right;"><button id="_nativeAlertOk" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FF6B9D; color: white; cursor: pointer; font-weight: 500;">OK</button></div>';
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    document.getElementById('_nativeAlertOk').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};
// Surface any unexpected JS error visibly instead of a click silently doing nothing -
// this makes it possible to diagnose "I clicked and nothing happened" reports.
window.addEventListener('error', function(e) {
    try {
        window.alert('Something went wrong: ' + (e.message || 'unknown error') + '\n\nTry reloading the page. If it keeps happening, note exactly what you clicked.');
    } catch (err) { /* ignore */ }
});
class GiftTracker {
    constructor() {
        const data = this.loadData();
        this.people = data?.people || [];
        this.events = data?.events || [];
        this.gifts = data?.gifts || [];
        this.shops = data?.shops || [];
        this.receivedGifts = data?.receivedGifts || [];
        this.otherGivers = data?.otherGivers || [];
        
        // Migrate any legacy received-gift records (fromPersonName/fromPersonId) to the
        // new giverType/giverId model, which stores a reference rather than a frozen name
        // so renames/merges cascade automatically.
        this.receivedGifts.forEach(rg => {
            if (!rg.giverType) {
                if (rg.fromPersonId) {
                    rg.giverType = 'person'; rg.giverId = rg.fromPersonId;
                } else if (rg.fromPersonName) {
                    const resolved = this.findOrCreateGiverByName(rg.fromPersonName, false);
                    if (resolved) { rg.giverType = resolved.giverType; rg.giverId = resolved.giverId; }
                }
                delete rg.fromPersonName;
                delete rg.fromPersonId;
            }
        });
        
        // Ensure all events have giftAssignments property
        this.events.forEach(e => {
            if (!e.giftAssignments) {
                e.giftAssignments = [];
            }
        });
        
        // Sync person budgets in birthday events from person's default birthday budget
        this.events.forEach(e => {
            if (e.type === 'birthday' && e.people && e.people.length > 0) {
                const person = this.people.find(p => p.fullName === e.people[0].name);
                if (person) {
                    const personBudget = person.birthdayBudget ? parseFloat(person.birthdayBudget) : 0;
                    e.people[0].budget = personBudget;
                    e.totalBudget = personBudget;
                }
            }
        });
        this.saveData();
        
        // Self-heal: if a gift or received gift still references an event ID that no
        // longer exists (e.g. from an event deleted before this cleanup was in place),
        // detach it rather than leaving a dangling reference. The gift record itself
        // (giver, price, notes, etc.) is preserved - it just shows "No event".
        const validEventIds = new Set(this.events.map(e => e.id));
        this.gifts.forEach(g => { if (g.eventId && !validEventIds.has(g.eventId)) g.eventId = null; });
        this.receivedGifts.forEach(g => { if (g.eventId && !validEventIds.has(g.eventId)) g.eventId = null; });
        
        // Best-effort backfill: if a received gift is tied to an event with exactly one
        // relevant person (Me or Adam) and has no receivedByPersonName yet, tag it now.
        this.receivedGifts.forEach(rg => {
            if (!rg.receivedByPersonName && rg.eventId) {
                const ev = this.events.find(e => e.id === rg.eventId);
                if (ev) {
                    const relevant = this.getRelevantPeopleForEvent(ev);
                    if (relevant.length === 1) rg.receivedByPersonName = relevant[0];
                }
            }
        });
        this.saveData();
        
        this.currentTab = 'events';
        this.expandedPerson = null;
        this.expandedEvent = null;
        this.expandedGift = null;
        this.expandedReceivedGift = null;
        this.editingPerson = null;
        this.editingEvent = null;
        this.editingGift = null;
        this.editingReceivedGift = null;
        this.addingPerson = false;
        this.addingEvent = false;
        this.addingGift = false;
        this.addingReceivedGift = false;
        this.eventType = null;
        this.newGiftEventId = null;
        this.newGiftPersonName = null;
        this.giftFormState = { giftName: '', person: '', event: null, price: '', shop: '', notes: '', status: 'idea', url: '' };
        this.receivedGiftFormState = { giftName: '', from: '', fromNewText: '', event: null, price: '', notes: '', thankYouSent: false, receivedBy: '' };
        this.showGiftStatus = 'all';
        this.showGiftsView = 'given';
        this.givenGroupBy = 'none';
        this.receivedGroupBy = 'none';
        this.receivedThankYouFilter = 'all';
        this.showEventType = 'upcoming';
        this.showEventReady = 'all';
        this.showEventCompleted = 'all';
        this.peopleTypeFilter = 'all';
        this.showPeopleCategory = 'all';
        this.showSettings = false;
        this.searchText = '';
        this.eventsSearchText = '';
        this.peopleSearchText = '';
        this.giftsSearchText = '';
        this.render();
    }
    loadData() { try { return JSON.parse(localStorage.getItem('giftTrackerData')); } catch(e) { return null; } }
    saveData() { try { localStorage.setItem('giftTrackerData', JSON.stringify({people: this.people, events: this.events, gifts: this.gifts, shops: this.shops, receivedGifts: this.receivedGifts, otherGivers: this.otherGivers})); } catch(e) {} }
    initSwipeHandlers() {
        setTimeout(() => {
            document.querySelectorAll('[data-swipe-item]').forEach(el => {
                let touchStartX = 0, touchEndX = 0;
                el.addEventListener('touchstart', (e) => { 
                    // Don't track swipes on buttons
                    if (e.target.classList.contains('swipe-edit') || e.target.classList.contains('swipe-delete')) return;
                    touchStartX = e.changedTouches[0].screenX; 
                });
                el.addEventListener('touchend', (e) => {
                    // Don't process swipes on buttons
                    if (e.target.classList.contains('swipe-edit') || e.target.classList.contains('swipe-delete')) return;
                    touchEndX = e.changedTouches[0].screenX;
                    const swipeDistance = Math.abs(touchStartX - touchEndX);
                    // Check if this is a nested item (person in event)
                    const isNested = el.parentElement && el.parentElement.closest('[data-swipe-item]');
                    if (isNested) {
                        // Stop propagation for nested items
                        e.stopPropagation();
                    }
                    if (swipeDistance > 50) {
                        // Swipe left - show delete
                        if (touchStartX - touchEndX > 50) {
                            el.classList.remove('swiped-right');
                            el.classList.add('swiped-left');
                        }
                        // Swipe right - show edit
                        else if (touchEndX - touchStartX > 50) {
                            el.classList.remove('swiped-left');
                            el.classList.add('swiped-right');
                        }
                    } else {
                        // Tap or small swipe - close/reset
                        el.classList.remove('swiped-left', 'swiped-right');
                    }
                });
            });
        }, 100);
    }
    setSearchText(text) { this.searchText = text.toLowerCase(); this.render(); }
    filterPeopleBySearch(people, searchText) {
        if (!searchText) return people;
        const searchLower = searchText.toLowerCase();
        return people.filter(p => {
            const nameMatch = p.fullName.toLowerCase().includes(searchLower);
            const likesMatch = (p.likes || '').toLowerCase().includes(searchLower);
            const dislikesMatch = (p.dislikes || '').toLowerCase().includes(searchLower);
            const eventMatch = this.events.some(e => {
                if (e.personName === p.fullName && e.name.toLowerCase().includes(searchLower)) return true;
                if (e.people && e.people.some(ep => ep.name === p.fullName && e.name.toLowerCase().includes(searchLower))) return true;
                return false;
            });
            const giftMatch = this.getGiftsForPerson(p.fullName).some(g => g.giftName.toLowerCase().includes(searchLower));
            return nameMatch || likesMatch || dislikesMatch || eventMatch || giftMatch;
        });
    }
    editPersonBudgetInEvent(eventId, personName) {
        const event = this.events.find(e => e.id === eventId);
        const person = event?.people?.find(p => p.name === personName);
        if (!person) return;
        
        // Create a simple modal with input
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '1000';
        
        const content = document.createElement('div');
        content.style.backgroundColor = 'var(--color-surface)';
        content.style.padding = '20px';
        content.style.borderRadius = '8px';
        content.style.minWidth = '300px';
        
        content.innerHTML = '<p style="color: var(--color-text); margin-bottom: 10px;">Edit budget for ' + personName + '</p>' +
            '<input type="number" id="budget-input" value="' + (person.budget || 0) + '" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid var(--color-border); border-radius: 4px; background-color: var(--color-surface); color: var(--color-text);">' +
            '<div style="display: flex; gap: 8px;">' +
            '<button id="budget-save" style="flex: 1; padding: 8px; background-color: var(--color-primary); color: var(--color-primary-text); border: none; border-radius: 4px; cursor: pointer;">Save</button>' +
            '<button id="budget-cancel" style="flex: 1; padding: 8px; background-color: var(--color-secondary); color: var(--color-text); border: none; border-radius: 4px; cursor: pointer;">Cancel</button>' +
            '</div>';
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        document.getElementById('budget-input').focus();
        
        document.getElementById('budget-save').onclick = () => {
            const newBudget = parseFloat(document.getElementById('budget-input').value) || 0;
            person.budget = newBudget;
            this.saveData();
            this.render();
            modal.remove();
        };
        
        document.getElementById('budget-cancel').onclick = () => {
            modal.remove();
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    getSpentPerPersonInEvent(eventId, personName) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return 0;
        
        // Get all gifts assigned to this person in this event
        const assignedGiftIds = (event.giftAssignments || [])
            .filter(ga => ga.personName === personName)
            .map(ga => ga.giftId);
        
        // Sum up prices of assigned gifts
        return this.gifts
            .filter(g => assignedGiftIds.includes(g.id))
            .reduce((sum, g) => sum + (g.price || 0), 0);
    }

    filterGiftsBySearch(gifts, searchText) { 
        if (!searchText) return gifts; 
        const lowerSearch = searchText.toLowerCase().trim();
        return gifts.filter(g => {
            const nameMatch = g.giftName.toLowerCase().includes(lowerSearch);
            const personMatch = g.personName && g.personName.toLowerCase().includes(lowerSearch);
            const eventMatch = g.eventId && this.events.find(e => e.id === g.eventId && e.name.toLowerCase().includes(lowerSearch));
            return nameMatch || personMatch || eventMatch;
        });
    }
    filterReceivedGiftsBySearch(gifts, searchText) {
        if (!searchText) return gifts;
        const lowerSearch = searchText.toLowerCase().trim();
        return gifts.filter(g => {
            const nameMatch = g.giftName.toLowerCase().includes(lowerSearch);
            const fromMatch = this.getGiverInfo(g).name.toLowerCase().includes(lowerSearch);
            const eventMatch = g.eventId && this.events.find(e => e.id === g.eventId && e.name.toLowerCase().includes(lowerSearch));
            return nameMatch || fromMatch || eventMatch;
        });
    }
    toggleAddPerson() { this.addingPerson = !this.addingPerson; this.render(); }
    addPerson(name, bday, year, likes, dislikes, notes, messageOnly, fyiOnly, category, includeInChristmas, birthdayBudget, christmasBudget) {
        if (!name || !bday || !year) return alert('Need name, birthday (DD-MM), year');
        this.people.push({ id: Math.max(...this.people.map(p => p.id), 0) + 1, fullName: name, birthday: bday, birthYear: parseInt(year), likes: likes || '', dislikes: dislikes || '', notes: notes || '', giftHistory: [], includeInChristmas: includeInChristmas || false, messageOnly: messageOnly || false, fyiOnly: fyiOnly || false, category: category || 'friend', birthdayBudget: birthdayBudget || '', christmasBudget: christmasBudget || '' });
        this.addingPerson = false; this.saveData(); this.render();
    }
    deletePerson(id) { this.people = this.people.filter(p => p.id !== id); this.saveData(); this.render(); }
    updatePerson(id, updates) { const p = this.people.find(x => x.id === id); if (p) Object.assign(p, updates); this.saveData(); this.render(); }
    expandPerson(id) { this.expandedPerson = this.expandedPerson === id ? null : id; this.editingPerson = null; this.render(); }
    toggleEditPerson(id) { this.editingPerson = this.editingPerson === id ? null : id; this.render(); }
    formatDate(ddmm, year) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const [day, month] = ddmm.split('-');
        return day + ' ' + months[parseInt(month) - 1] + ' ' + year;
    }
    formatDateOrdinal(dateStr) {
        // dateStr format: DD-MM-YYYY
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const [day, month, year] = dateStr.split('-');
        const dayNum = parseInt(day);
        const monthNum = parseInt(month) - 1;
        let suffix = 'th';
        const lastTwo = dayNum % 100;
        if (lastTwo < 11 || lastTwo > 13) {
            const lastDigit = dayNum % 10;
            if (lastDigit === 1) suffix = 'st';
            else if (lastDigit === 2) suffix = 'nd';
            else if (lastDigit === 3) suffix = 'rd';
        }
        return dayNum + suffix + ' ' + months[monthNum];
    }
    getEventDateColor(event) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [day, month, year] = event.date.split('-');
        const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        eventDate.setHours(0, 0, 0, 0);
        
        const daysUntil = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
        const isPast = daysUntil < 0;
        const isToday = daysUntil === 0;
        const person = event.personId ? this.people.find(p => p.id === event.personId) : null;
        const isMessageOnly = person && person.messageOnly;
        const allGiftsGifted = this.areAllEventGiftsGifted(event.id);
        
        // Future events with gifts - red if less than 30 days away
        if (!isPast && !isMessageOnly && daysUntil < 30 && daysUntil > 0) {
            return 'red';
        }
        
        // Message-only events - red only on the day
        if (isMessageOnly && isToday) {
            return 'red';
        }
        
        // Past events - red only if gifts weren't given or message wasn't sent
        if (isPast) {
            if (isMessageOnly && !event.messaged) {
                return 'red';
            }
            if (!isMessageOnly && !allGiftsGifted) {
                return 'red';
            }
        }
        
        return 'var(--color-text-muted)';
    }
    getDaysUntil(person) {
        const today = new Date();
        const [day, month] = person.birthday.split('-');
        let birthdayThisYear = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
        if (birthdayThisYear < today) birthdayThisYear = new Date(today.getFullYear() + 1, parseInt(month) - 1, parseInt(day));
        const christmasThisYear = new Date(today.getFullYear(), 11, 25);
        let christmasNext = christmasThisYear;
        if (today > christmasThisYear) christmasNext = new Date(today.getFullYear() + 1, 11, 25);
        if (person.includeInChristmas) {
            const nextDate = birthdayThisYear <= christmasNext ? birthdayThisYear : christmasNext;
            const daysLeft = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
            return daysLeft;
        } else {
            const daysLeft = Math.ceil((birthdayThisYear - today) / (1000 * 60 * 60 * 24));
            return daysLeft;
        }
    }
    getNextEvent(person) {
        const today = new Date();
        const [day, month] = person.birthday.split('-');
        let birthdayThisYear = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
        if (birthdayThisYear < today) birthdayThisYear = new Date(today.getFullYear() + 1, parseInt(month) - 1, parseInt(day));
        if (!person.includeInChristmas) {
            return this.formatDate(person.birthday, birthdayThisYear.getFullYear()) + ' (Birthday)';
        }
        const christmasThisYear = new Date(today.getFullYear(), 11, 25);
        let christmasNext = christmasThisYear;
        if (today > christmasThisYear) christmasNext = new Date(today.getFullYear() + 1, 11, 25);
        if (birthdayThisYear <= christmasNext) {
            return this.formatDate(person.birthday, birthdayThisYear.getFullYear()) + ' (Birthday)';
        } else {
            return '25 Dec (Christmas)';
        }
    }
    toggleAddEvent() { this.addingEvent = !this.addingEvent; this.eventType = null; this.render(); }
    selectEventType(type) { this.eventType = type; this.render(); }
    addCustomEvent(name, date, budget, person) {
        if (!name || !date) return alert('Event name and date required');
        const parts = date.split('-');
        if (parts.length !== 3) return alert('Date must be DD-MM-YYYY');
        const pid = person ? parseInt(person) : null;
        const pname = pid ? (this.people.find(p => p.id === pid)?.fullName || '') : '';
        const peopleArray = pid ? [{name: pname, budget: parseFloat(budget) || 0}] : [];
        this.events.push({ id: Math.max(...this.events.map(e => e.id), 0) + 1, type: 'custom', name: name, date: parts[0] + '-' + parts[1] + '-' + parts[2], totalBudget: parseFloat(budget) || 0, notes: '', year: parseInt(parts[2]), people: peopleArray, giftIds: [], giftAssignments: [] });
        this.addingEvent = false; this.eventType = null; this.saveData(); this.render();
    }
    getYearDropdown() { const y = new Date().getFullYear(); let s = '<option value="' + y + '" selected>' + y + ' (Current)</option>'; for (let i = y - 7; i < y; i++) s += '<option value="' + i + '">' + i + '</option>'; for (let i = y + 1; i <= y + 5; i++) s += '<option value="' + i + '">' + i + '</option>'; return s; }
    addBirthdayEvent(pid, year) {
        if (!pid || !year) return alert('Select person and year');
        const p = this.people.find(x => x.id === parseInt(pid));
        if (!p) return;
        const age = parseInt(year) - p.birthYear;
        const parts = p.birthday.split('-');
        const personBudget = p.birthdayBudget ? parseFloat(p.birthdayBudget) : 0;
        this.events.push({ id: Math.max(...this.events.map(e => e.id), 0) + 1, type: 'birthday', name: p.fullName + ': ' + age, date: parts[0] + '-' + parts[1] + '-' + year, totalBudget: personBudget, notes: '', personId: p.id, personName: p.fullName, year: parseInt(year), people: [{name: p.fullName, budget: personBudget}], giftIds: [], giftAssignments: [], messages: p.messageOnly ? [] : undefined });
        this.addingEvent = false; this.eventType = null; this.saveData(); this.render();
    }
    addChristmasEvent(year, budget) {
        if (!year) return alert('Select year');
        year = parseInt(year);
        const christmasDate = new Date(year, 11, 25);
        const cp = this.people.filter(p => {
            if (!p.includeInChristmas) return false;
            const [day, month] = p.birthday.split('-');
            const birthdayInYear = new Date(year, parseInt(month) - 1, parseInt(day));
            return birthdayInYear <= christmasDate;
        }).map(p => ({name: p.fullName, budget: p.christmasBudget ? parseFloat(p.christmasBudget) : 0}));
        const totalPersonBudgets = cp.reduce((sum, person) => sum + (person.budget || 0), 0);
        const eventBudget = parseFloat(budget) || totalPersonBudgets;
        if (eventBudget < totalPersonBudgets) {
            alert('Warning: Event budget (£' + eventBudget.toFixed(2) + ') is less than sum of person budgets (£' + totalPersonBudgets.toFixed(2) + '). Event will be created but you are underfunded.');
        }
        this.events.push({ id: Math.max(...this.events.map(e => e.id), 0) + 1, type: 'christmas', name: 'Christmas ' + year, date: '25-12-' + year, totalBudget: eventBudget, notes: '', year: parseInt(year), people: cp, giftIds: [], giftAssignments: [] });
        this.addingEvent = false; this.eventType = null; this.saveData(); this.render();
    }
    createAllEventsForYear(year) {
        if (!year) return alert('Select year');
        year = parseInt(year);
        let created = 0;
        this.people.filter(p => !p.fyiOnly).forEach(p => {
            if (!this.events.find(e => e.type === 'birthday' && e.personId === p.id && e.year === year)) {
                this.addBirthdayEvent(p.id, year);
                created++;
            }
        });
        if (!this.events.find(e => e.type === 'christmas' && e.year === year)) {
            this.addChristmasEvent(year, 0);
            created++;
        }
        this.showSettings = false;
        alert('Created ' + created + ' event(s)');
        this.render();
    }
    updateEvent(id, updates) { const e = this.events.find(x => x.id === id); if (e) Object.assign(e, updates); this.saveData(); this.render(); }
    deleteEvent(id) { this.events = this.events.filter(e => e.id !== id); this.gifts.forEach(g => { if (g.eventId === id) g.eventId = null; }); this.receivedGifts.forEach(g => { if (g.eventId === id) g.eventId = null; }); this.saveData(); this.render(); }
    expandEvent(id) { this.expandedEvent = this.expandedEvent === id ? null : id; this.editingEvent = null; this.render(); }
    toggleEditEvent(id) { this.editingEvent = this.editingEvent === id ? null : id; this.render(); }
    isEventReady(e) { return this.getGiftsForEvent(e.id).some(g => ['bought', 'wrapped', 'gifted'].includes(g.status)); }
    isEventCompleted(e) {
        const person = e.personId ? this.people.find(p => p.id === e.personId) : null;
        const isMessageOnly = person && person.messageOnly;
        if (isMessageOnly) {
            return e.messaged === true;
        } else {
            const gifts = this.getGiftsForEvent(e.id);
            return gifts.length > 0 && gifts.every(g => g.status === 'gifted');
        }
    }
    addGiftToEvent(eid, gid, personName) { 
        const e = this.events.find(x => x.id === eid); 
        const g = this.gifts.find(x => x.id === gid); 
        if (e && g) { 
            // Ensure the person is in the event's people list
            if (!e.people) e.people = [];
            if (!e.people.find(p => p.name === personName)) {
                e.people.push({name: personName, budget: 0});
            }
            
            if (!e.giftAssignments) e.giftAssignments = [];
            if (!e.giftAssignments.find(ga => ga.giftId === gid && ga.personName === personName)) { 
                e.giftAssignments.push({giftId: gid, personName: personName});
                if (!e.giftIds) e.giftIds = [];
                if (!e.giftIds.includes(gid)) e.giftIds.push(gid);
                g.eventId = eid;
                g.personName = personName;
                this.saveData(); 
                this.render(); 
            } 
        } 
    }
    
    removeGiftFromEvent(eid, gid, personName) {
        const e = this.events.find(x => x.id === eid);
        if (e && e.giftAssignments) {
            e.giftAssignments = e.giftAssignments.filter(ga => !(ga.giftId === gid && ga.personName === personName));
            if (e.giftIds) {
                e.giftIds = e.giftIds.filter(id => id !== gid);
            }
            this.saveData();
            this.render();
        }
    }
    
    editGiftStatus(gid, personName, eid) {
        const g = this.gifts.find(x => x.id === gid);
        if (!g) return;
        const statuses = ['idea', 'planned', 'bought', 'wrapped', 'gifted'];
        let html = '<div style="padding: 20px; text-align: center;"><h3 style="margin-bottom: 10px; color: #2D3436;">Gift: ' + g.giftName + '</h3><p style="margin-bottom: 20px; color: #636E72;">Current status: <strong>' + g.status + '</strong></p><label style="display: block; margin-bottom: 15px; color: #2D3436;">Select new status:</label><select id="statusSelect" style="width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #DFE6E9; border-radius: 4px; font-size: 16px;"><option value="">-- Select Status --</option>' + statuses.map(s => '<option value="' + s + '"' + (s === g.status ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>').join('') + '</select></div>';
        
        // Create a custom dialog-like experience by using a temporary modal
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
        
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; padding: 30px; width: 90%; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        const expandedEventId = this.expandedEvent; // Preserve the expanded event
        dialog.innerHTML = html + '<div style="display: flex; gap: 10px; justify-content: flex-end;"><button onclick="document.querySelector(\'[data-modal-overlay]\').remove();" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FFE66D; color: #2D3436; cursor: pointer; font-weight: 500;">Cancel</button><button onclick="const select = document.getElementById(\'statusSelect\'); const status = select.value; if(status) { const gift = window.app.gifts.find(g => g.id === ' + gid + '); if(gift) { gift.status = status; window.app.saveData(); window.app.expandedEvent = ' + expandedEventId + '; document.querySelector(\'[data-modal-overlay]\').remove(); window.app.render(); } } else { alert(\'Please select a status\'); }" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FF6B9D; color: white; cursor: pointer; font-weight: 500;">OK</button></div>';
        
        modal.setAttribute('data-modal-overlay', 'true');
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    
    addPersonToEvent(eid, personFullName) {
        const e = this.events.find(x => x.id === eid);
        if (e && personFullName) {
            if (!e.people) e.people = [];
            // Check if person already in event
            if (!e.people.find(p => p.name === personFullName)) {
                e.people.push({name: personFullName, budget: 0});
                this.saveData();
                this.render();
            }
        }
    }
    
    removePersonFromEvent(eid, personName) {
        const e = this.events.find(x => x.id === eid);
        if (e) {
            e.people = e.people.filter(p => p.name !== personName);
            
            // For group events (like Christmas), track excluded people so they don't reappear
            if (e.type === 'christmas' || e.type === 'group') {
                if (!e.excludedPeople) e.excludedPeople = [];
                if (!e.excludedPeople.includes(personName)) {
                    e.excludedPeople.push(personName);
                }
            }
            
            // Also remove any gift assignments for this person
            if (e.giftAssignments) {
                e.giftAssignments = e.giftAssignments.filter(ga => ga.personName !== personName);
            }
            this.saveData();
            this.render();
        }
    }
    addMessageToEvent(eid, personName) {
        if (!personName) return alert('Person name required');
        const e = this.events.find(x => x.id === eid);
        if (e) {
            if (!e.messages) e.messages = [];
            if (!e.messages.find(m => m.personName === personName)) {
                e.messages.push({id: Math.max(...(e.messages.map(m => m.id) || [0])), personName: personName, done: false});
                this.saveData();
                this.render();
            } else {
                alert('Already added for this person');
            }
        }
    }
    toggleMessageDone(eid, mid) {
        const e = this.events.find(x => x.id === eid);
        if (e && e.messages) {
            const m = e.messages.find(msg => msg.id === mid);
            if (m) m.done = !m.done;
            this.saveData();
            this.render();
        }
    }
    deleteMessageFromEvent(eid, mid) {
        const e = this.events.find(x => x.id === eid);
        if (e && e.messages) {
            e.messages = e.messages.filter(m => m.id !== mid);
            this.saveData();
            this.render();
        }
    }
    getBudgetStatus(e) {
        const spent = this.getGiftsForEvent(e.id).reduce((s, g) => s + g.price, 0);
        const budget = e.totalBudget || 0;
        if (budget === 0) return '';
        if (spent === 0) return '<span style="background-color: var(--color-secondary); color: var(--color-text); padding: 2px 8px; border-radius: 4px; font-size: 12px;">No spending</span>';
        if (spent > budget) return '<span style="background-color: #FFE5E0; color: var(--color-error); padding: 2px 8px; border-radius: 4px; font-size: 12px;">Over budget</span>';
        return '<span style="background-color: #D5E8E0; color: var(--color-success); padding: 2px 8px; border-radius: 4px; font-size: 12px;">Within budget</span>';
    }
    toggleAddGift(personName, eventId) {
        this.addingGift = !this.addingGift;
        this.newGiftEventId = null;
        this.newGiftPersonName = null;
        if (this.addingGift) {
            this.giftFormState = { giftName: '', person: personName || '', event: eventId || null, price: '', shop: '', notes: '', status: 'idea', url: '' };
        }
        this.render();
    }
    renderAddGiftForm() {
        const selectedPerson = this.giftFormState.person;
        const personEvents = selectedPerson ? this.events.filter(e => {
            const person = this.people.find(p => p.fullName === selectedPerson);
            if (!person) return false;
            // Check if it's a birthday event for this person OR a group event that includes this person
            return e.personId === person.id || (e.people && e.people.some(ep => ep.name === selectedPerson));
        }).sort((a, b) => {
            const [dA, mA, yA] = a.date.split('-');
            const [dB, mB, yB] = b.date.split('-');
            return new Date(parseInt(yA), parseInt(mA) - 1, parseInt(dA)) - new Date(parseInt(yB), parseInt(mB) - 1, parseInt(dB));
        }) : [];
        return '<div class="mb-4 p-4 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border);"><h3 class="font-semibold mb-3" style="color: var(--color-text);">Add Gift</h3><input type="text" id="gname" placeholder="Gift name" value="' + this.giftFormState.giftName + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);" oninput="window.app.giftFormState.giftName = this.value"><select id="gperson" onchange="window.app.giftFormState.person = this.value; window.app.render()" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">Select Person (optional)</option>' + this.getGiftablePeople().map(p => '<option value="' + p.fullName + '"' + (this.giftFormState.person === p.fullName ? ' selected' : '') + '>' + p.fullName + '</option>').join('') + '</select>' + (selectedPerson ? '<select id="gevent" onchange="window.app.giftFormState.event = parseInt(this.value) || null" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">Select Event (optional)</option>' + personEvents.map(e => '<option value="' + e.id + '"' + (this.giftFormState.event === e.id ? ' selected' : '') + '>' + e.name + '</option>').join('') + '</select>' : '') + '<input type="number" id="gprice" placeholder="Price" value="' + this.giftFormState.price + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);" oninput="window.app.giftFormState.price = this.value"><input type="text" id="gurl" placeholder="URL" value="' + this.giftFormState.url + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);" oninput="window.app.giftFormState.url = this.value"><div class="flex gap-2 mb-2"><select id="gshop" onchange="window.app.giftFormState.shop = this.value" class="flex-1 p-2 rounded border" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">Select Shop</option>' + this.shops.map(s => '<option value="' + s + '"' + (this.giftFormState.shop === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select><button onclick="window.app.showPromptModal(\'Shop name\', \'\', (shop) => { if (shop) window.app.addShop(shop); }, \'Add Shop\')" class="px-3 py-2 rounded text-white" style="background-color: var(--color-accent); color: white;">+</button></div><textarea id="gnotes" placeholder="Notes" class="w-full p-2 rounded border mb-2" rows="2" style="background-color: var(--color-surface); border-color: var(--color-border);" oninput="window.app.giftFormState.notes = this.value">' + this.giftFormState.notes + '</textarea><select id="gstatus" onchange="window.app.giftFormState.status = this.value" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><option value="idea"' + (this.giftFormState.status === 'idea' ? ' selected' : '') + '>Idea</option><option value="planned"' + (this.giftFormState.status === 'planned' ? ' selected' : '') + '>Planned</option><option value="bought"' + (this.giftFormState.status === 'bought' ? ' selected' : '') + '>Bought</option><option value="wrapped"' + (this.giftFormState.status === 'wrapped' ? ' selected' : '') + '>Wrapped</option><option value="gifted"' + (this.giftFormState.status === 'gifted' ? ' selected' : '') + '>Gifted</option></select><button onclick="if(!window.app.giftFormState.giftName) { alert(\'Please enter gift name\'); return; } window.app.addGift(window.app.giftFormState.giftName, window.app.giftFormState.person, window.app.giftFormState.event, window.app.giftFormState.price, window.app.giftFormState.status, null, window.app.giftFormState.url, window.app.giftFormState.notes, window.app.giftFormState.shop)" class="px-4 py-2 rounded text-white mr-2" style="background-color: var(--color-primary); color: var(--color-primary-text);">Add</button><button onclick="window.app.addingGift = false; window.app.render()" class="px-4 py-2 rounded" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button></div>';
    }
    toggleAddReceivedGift(eventId, receivedByPersonName) {
        this.addingReceivedGift = !this.addingReceivedGift;
        if (this.addingReceivedGift) {
            this.receivedGiftFormState = { giftName: '', from: '', fromNewText: '', event: eventId || null, price: '', notes: '', thankYouSent: false, receivedBy: receivedByPersonName || '' };
        }
        this.render();
    }
    getUnassignedReceivedGifts() { return this.receivedGifts.filter(g => !g.eventId); }
    assignReceivedGiftToEvent(eventId, giftId, personName) {
        const g = this.receivedGifts.find(x => x.id === giftId);
        if (g) {
            g.eventId = eventId ? parseInt(eventId) : null;
            if (personName) g.receivedByPersonName = personName;
            this.saveData();
            this.render();
        }
    }
    renderReceivedGiftPicker(eventId, personName, panelId) {
        const unassigned = this.getUnassignedReceivedGifts();
        const safePersonName = (personName || '').replace(/'/g, "\\'");
        let html = '<div id="' + panelId + '" style="display: none; padding: 10px; margin-bottom: 10px; border: 1px solid var(--color-border); border-radius: 6px; background-color: var(--color-secondary);">';
        if (unassigned.length > 0) {
            html += '<label style="display: block; margin-bottom: 6px; color: var(--color-text); font-size: 12px;">Assign an existing unassigned gift</label><select id="' + panelId + '_select" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text); font-size: 12px;"><option value="">Choose a gift...</option>' + unassigned.map(g => {
                const giverInfo = this.getGiverInfo(g);
                return '<option value="' + g.id + '">' + g.giftName + ' (from ' + giverInfo.name + (g.price ? ', £' + g.price.toFixed(2) : '') + ')</option>';
            }).join('') + '</select><button onclick="const sel = document.getElementById(\'' + panelId + '_select\'); const gid = sel.value; if(gid) { window.app.assignReceivedGiftToEvent(' + eventId + ', parseInt(gid), \'' + safePersonName + '\'); }" class="w-full px-3 py-2 rounded text-sm mb-2" style="background-color: var(--color-primary); color: white; font-size: 12px;">Assign This Gift</button>';
        } else {
            html += '<p style="color: var(--color-text-muted); font-size: 12px; margin-bottom: 8px;">No unassigned received gifts yet.</p>';
        }
        html += '<button onclick="document.getElementById(\'' + panelId + '\').style.display = \'none\'; window.app.toggleAddReceivedGift(' + eventId + ', \'' + safePersonName + '\')" class="w-full px-3 py-2 rounded text-sm" style="background-color: var(--color-accent); color: white; font-size: 12px;">+ Log a brand new gift</button>';
        html += '</div>';
        return html;
    }
    addShop(shopName) {
        if (!shopName || !shopName.trim()) return;
        const trimmed = shopName.trim();
        if (!this.shops.includes(trimmed)) {
            this.shops.push(trimmed);
            this.saveData();
        }
        this.render();
    }
    deleteShop(index) {
        this.shops.splice(index, 1);
        this.saveData();
        this.render();
    }
    toggleSettings() { this.showSettings = !this.showSettings; this.render(); }
    addGift(name, person, eid, price, status, category, url, notes, shop) {
        if (!name) return alert('Enter gift name');
        const validEid = this.validateEventId(eid);
        const gid = Math.max(...this.gifts.map(g => g.id), 0) + 1;
        this.gifts.push({ id: gid, giftName: name, personName: person || '', eventId: validEid, status: status || 'idea', price: parseFloat(price) || 0, url: url || '', notes: notes || '', category: category || 'other', shop: shop || '', photoUrl: '', purchaseYear: new Date().getFullYear() });
        if (person) {
            const p = this.people.find(x => x.fullName === person);
            if (p) {
                if (!p.giftHistory) p.giftHistory = [];
                p.giftHistory.push({giftName: name, price: parseFloat(price) || 0, year: new Date().getFullYear()});
            }
        }
        // If both person and event are selected, add to event's giftAssignments
        if (person && validEid) {
            const e = this.events.find(x => x.id === validEid);
            if (e) {
                if (!e.people) e.people = [];
                if (!e.people.find(p => p.name === person)) {
                    e.people.push({name: person, budget: 0});
                }
                if (!e.giftAssignments) e.giftAssignments = [];
                if (!e.giftAssignments.find(ga => ga.giftId === gid && ga.personName === person)) {
                    e.giftAssignments.push({giftId: gid, personName: person});
                }
                if (!e.giftIds) e.giftIds = [];
                if (!e.giftIds.includes(gid)) e.giftIds.push(gid);
            }
        }
        this.addingGift = false; this.newGiftEventId = null; this.newGiftPersonName = null; this.giftFormState = { giftName: '', person: '', event: null, price: '', shop: '', notes: '', status: 'idea', url: '' }; this.saveData(); this.render();
    }
    updateGift(id, updates) { 
        const g = this.gifts.find(x => x.id === id);
        if (g) {
            if ('eventId' in updates) updates.eventId = this.validateEventId(updates.eventId);
            const oldEventId = g.eventId;
            const newEventId = updates.eventId;
            const personName = updates.personName || g.personName;
            
            Object.assign(g, updates);
            
            // If the event changed, update the event's giftAssignments
            if (oldEventId !== newEventId) {
                // Remove from old event if it existed
                if (oldEventId) {
                    const oldEvent = this.events.find(e => e.id === oldEventId);
                    if (oldEvent) {
                        if (oldEvent.giftAssignments) {
                            oldEvent.giftAssignments = oldEvent.giftAssignments.filter(ga => ga.giftId !== id);
                        }
                        if (oldEvent.giftIds) {
                            oldEvent.giftIds = oldEvent.giftIds.filter(gid => gid !== id);
                        }
                    }
                }
                
                // Add to new event if specified
                if (newEventId && personName) {
                    const newEvent = this.events.find(e => e.id === newEventId);
                    if (newEvent) {
                        if (!newEvent.giftAssignments) newEvent.giftAssignments = [];
                        if (!newEvent.giftIds) newEvent.giftIds = [];
                        
                        // Add assignment if it doesn't exist
                        if (!newEvent.giftAssignments.find(ga => ga.giftId === id && ga.personName === personName)) {
                            newEvent.giftAssignments.push({giftId: id, personName: personName});
                        }
                        if (!newEvent.giftIds.includes(id)) {
                            newEvent.giftIds.push(id);
                        }
                    }
                }
            }
            
            this.saveData();
            this.render();
        }
    }
    deleteGift(id) { this.gifts = this.gifts.filter(g => g.id !== id); this.events.forEach(e => { if (e.giftIds) e.giftIds = e.giftIds.filter(gid => gid !== id); }); this.saveData(); this.render(); }
    expandGift(id) { this.expandedGift = this.expandedGift === id ? null : id; this.editingGift = null; this.render(); }
    toggleEditGift(id) { this.editingGift = this.editingGift === id ? null : id; this.render(); }
    getGiftsForEvent(eid) { return this.gifts.filter(g => g.eventId === eid); }
    getGiftsForPerson(name) { return this.gifts.filter(g => g.personName === name); }
    getGiftsForEventAndPerson(eid, name) { return this.gifts.filter(g => g.eventId === eid && g.personName === name); }
    getReceivedGiftsForEvent(eid) { return this.receivedGifts.filter(g => g.eventId === eid); }
    getRelevantPeopleForEvent(e) {
        // People on this event whose name is (or contains, as a whole word) "Me" or "Adam" -
        // matches whole words only so names like "Amelia", "James", or "Emerson" aren't caught.
        const matches = (name) => /\b(me|adam)\b/i.test(name || '');
        const names = [];
        if (e.personId) {
            const p = this.people.find(x => x.id === e.personId);
            if (p && matches(p.fullName) && !names.includes(p.fullName)) names.push(p.fullName);
        }
        if (e.people) {
            e.people.forEach(p => { if (matches(p.name) && !names.includes(p.name)) names.push(p.name); });
        }
        return names;
    }
    isReceivedGiftsRelevantEvent(e) { return this.getRelevantPeopleForEvent(e).length > 0; }
    getMeAdamPeopleNames() {
        const matches = (name) => /\b(me|adam)\b/i.test(name || '');
        return this.getSortedPeople().filter(p => matches(p.fullName)).map(p => p.fullName);
    }
    getReceivedGiftsRelevantEvents(personName) {
        const events = this.getSortedEvents().filter(e => this.isReceivedGiftsRelevantEvent(e));
        if (!personName) return events;
        return events.filter(e => this.getRelevantPeopleForEvent(e).includes(personName));
    }
    getReceivedGiftsForPerson(personId) { return this.receivedGifts.filter(g => g.giverType === 'person' && g.giverId === personId); }
    normalizeName(s) { return (s || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
    getGiverInfo(g) {
        if (g.giverType === 'person') {
            const p = this.people.find(x => x.id === g.giverId);
            return { name: p ? p.fullName : '(deleted person)', type: 'person', exists: !!p };
        } else if (g.giverType === 'other') {
            const o = this.otherGivers.find(x => x.id === g.giverId);
            return { name: o ? o.name : '(deleted giver)', type: 'other', exists: !!o };
        }
        return { name: 'Unknown', type: null, exists: false };
    }
    findOrCreateGiverByName(name, interactive) {
        const norm = this.normalizeName(name);
        if (!norm) return null;
        const person = this.people.find(p => this.normalizeName(p.fullName) === norm);
        if (person) return { giverType: 'person', giverId: person.id };
        const giver = this.otherGivers.find(g => this.normalizeName(g.name) === norm);
        if (giver) return { giverType: 'other', giverId: giver.id };
        if (interactive) {
            const candidates = [
                ...this.people.map(p => ({ type: 'person', id: p.id, name: p.fullName })),
                ...this.otherGivers.map(g => ({ type: 'other', id: g.id, name: g.name }))
            ].filter(c => {
                const cn = this.normalizeName(c.name);
                return cn.includes(norm) || norm.includes(cn);
            });
            if (candidates.length > 0) {
                const useExisting = confirm('A similar name already exists: "' + candidates[0].name + '".\n\nOK = use "' + candidates[0].name + '"\nCancel = create a new entry for "' + name.trim() + '"');
                if (useExisting) return { giverType: candidates[0].type, giverId: candidates[0].id };
            }
        }
        const newId = Math.max(...this.otherGivers.map(g => g.id), 0) + 1;
        this.otherGivers.push({ id: newId, name: name.trim() });
        return { giverType: 'other', giverId: newId };
    }
    showConfirmModal(message, onConfirm, title) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; padding: 24px; width: 90%; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        dialog.innerHTML = (title ? '<h3 style="margin-bottom: 12px; color: #2D3436;">' + title + '</h3>' : '') + '<p style="color: #2D3436; margin-bottom: 20px; white-space: pre-line; line-height: 1.5;">' + message + '</p><div style="display: flex; gap: 8px; justify-content: flex-end;"><button id="_confirmCancel" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FFE66D; color: #2D3436; cursor: pointer; font-weight: 500;">Cancel</button><button id="_confirmOk" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FF6B9D; color: white; cursor: pointer; font-weight: 500;">Continue</button></div>';
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        document.getElementById('_confirmCancel').onclick = () => modal.remove();
        document.getElementById('_confirmOk').onclick = () => { modal.remove(); onConfirm(); };
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    showPromptModal(labelText, initialValue, onSubmit, title, multiline) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; padding: 24px; width: 90%; max-width: 450px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        const safeInitial = (initialValue || '').replace(/"/g, '&quot;');
        const inputHtml = multiline
            ? '<textarea id="_promptInput" rows="8" style="width: 100%; padding: 10px; margin-bottom: 16px; border: 1px solid #DFE6E9; border-radius: 6px; font-size: 14px; font-family: monospace; box-sizing: border-box;"></textarea>'
            : '<input type="text" id="_promptInput" value="' + safeInitial + '" style="width: 100%; padding: 10px; margin-bottom: 16px; border: 1px solid #DFE6E9; border-radius: 6px; font-size: 14px; box-sizing: border-box;">';
        dialog.innerHTML = (title ? '<h3 style="margin-bottom: 12px; color: #2D3436;">' + title + '</h3>' : '') + (labelText ? '<label style="display: block; margin-bottom: 8px; color: #2D3436; font-size: 13px;">' + labelText + '</label>' : '') + inputHtml + '<div style="display: flex; gap: 8px; justify-content: flex-end;"><button id="_promptCancel" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FFE66D; color: #2D3436; cursor: pointer; font-weight: 500;">Cancel</button><button id="_promptOk" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FF6B9D; color: white; cursor: pointer; font-weight: 500;">OK</button></div>';
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        const inputEl = document.getElementById('_promptInput');
        if (!multiline) { inputEl.focus(); inputEl.select(); }
        document.getElementById('_promptCancel').onclick = () => modal.remove();
        document.getElementById('_promptOk').onclick = () => {
            const val = inputEl.value;
            modal.remove();
            onSubmit(val);
        };
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    renameOtherGiver(id) {
        const giver = this.otherGivers.find(g => g.id === id);
        if (!giver) return;
        this.showPromptModal('New name', giver.name, (newName) => {
            if (newName && newName.trim()) {
                giver.name = newName.trim();
                this.saveData();
                this.render();
            }
        }, 'Rename Giver');
    }
    deleteOtherGiver(id) {
        const inUse = this.receivedGifts.some(rg => rg.giverType === 'other' && rg.giverId === id);
        const performDelete = () => {
            this.otherGivers = this.otherGivers.filter(g => g.id !== id);
            this.saveData();
            this.render();
        };
        if (inUse) {
            this.showConfirmModal('This giver has received-gift records linked to them. Deleting will leave those gifts showing "(deleted giver)" instead of being removed.', performDelete, 'Delete Giver?');
        } else {
            performDelete();
        }
    }
    mergeOtherGiverPrompt(giverId) {
        const giver = this.otherGivers.find(g => g.id === giverId);
        if (!giver) return;
        const options = [
            ...this.getSortedPeople().map(p => ({ type: 'person', id: p.id, name: p.fullName })),
            ...this.otherGivers.filter(g => g.id !== giverId).map(g => ({ type: 'other', id: g.id, name: g.name }))
        ];
        if (options.length === 0) { alert('No other people or givers to merge into.'); return; }
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; padding: 24px; width: 90%; max-width: 400px;';
        dialog.innerHTML = '<h3 style="margin-bottom: 12px; color: #2D3436;">Merge "' + giver.name + '" into...</h3>' +
            '<select id="merge_target" style="width: 100%; padding: 8px; margin-bottom: 16px; border: 1px solid #DFE6E9; border-radius: 4px;">' + options.map((o, i) => '<option value="' + i + '">' + o.name + (o.type === 'person' ? ' (Person)' : ' (Other Giver)') + '</option>').join('') + '</select>' +
            '<p style="font-size: 12px; color: #636E72; margin-bottom: 16px;">All gifts logged from "' + giver.name + '" will be reassigned to the selected entry. This can\'t be undone.</p>' +
            '<div style="display: flex; gap: 8px; justify-content: flex-end;">' +
            '<button id="merge_cancel" style="padding: 8px 16px; border: none; border-radius: 6px; background-color: #FFE66D; cursor: pointer;">Cancel</button>' +
            '<button id="merge_save" style="padding: 8px 16px; border: none; border-radius: 6px; background-color: #FF6B9D; color: white; cursor: pointer;">Merge</button>' +
            '</div>';
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        document.getElementById('merge_cancel').onclick = () => modal.remove();
        document.getElementById('merge_save').onclick = () => {
            const idx = parseInt(document.getElementById('merge_target').value);
            const target = options[idx];
            this.receivedGifts.forEach(rg => {
                if (rg.giverType === 'other' && rg.giverId === giverId) {
                    rg.giverType = target.type;
                    rg.giverId = target.id;
                }
            });
            this.otherGivers = this.otherGivers.filter(g => g.id !== giverId);
            this.saveData();
            modal.remove();
            this.render();
        };
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    convertGiverToPerson(giverId) {
        const giver = this.otherGivers.find(g => g.id === giverId);
        if (!giver) return;
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; padding: 24px; width: 90%; max-width: 400px;';
        dialog.innerHTML = '<h3 style="margin-bottom: 12px; color: #2D3436;">Convert "' + giver.name + '" to a full Person</h3>' +
            '<label style="display: block; margin-bottom: 6px; color: #2D3436; font-size: 12px;">Birthday</label>' +
            '<input type="date" id="cvt_bday" style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #DFE6E9; border-radius: 4px;">' +
            '<label style="display: block; margin-bottom: 6px; color: #2D3436; font-size: 12px;">Category</label>' +
            '<select id="cvt_cat" style="width: 100%; padding: 8px; margin-bottom: 16px; border: 1px solid #DFE6E9; border-radius: 4px;"><option value="friend">Friend</option><option value="family">Family</option></select>' +
            '<p style="font-size: 12px; color: #636E72; margin-bottom: 16px;">All gifts logged from "' + giver.name + '" will be re-linked to the new Person.</p>' +
            '<div style="display: flex; gap: 8px; justify-content: flex-end;">' +
            '<button id="cvt_cancel" style="padding: 8px 16px; border: none; border-radius: 6px; background-color: #FFE66D; cursor: pointer;">Cancel</button>' +
            '<button id="cvt_save" style="padding: 8px 16px; border: none; border-radius: 6px; background-color: #FF6B9D; color: white; cursor: pointer;">Convert</button>' +
            '</div>';
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        document.getElementById('cvt_cancel').onclick = () => modal.remove();
        document.getElementById('cvt_save').onclick = () => {
            const bdayVal = document.getElementById('cvt_bday').value;
            if (!bdayVal) { alert('Please select a birthday'); return; }
            const [y, m, d] = bdayVal.split('-');
            const category = document.getElementById('cvt_cat').value;
            const newId = Math.max(...this.people.map(p => p.id), 0) + 1;
            this.people.push({ id: newId, fullName: giver.name, birthday: d + '-' + m, birthYear: parseInt(y), likes: '', dislikes: '', notes: '', giftHistory: [], includeInChristmas: false, messageOnly: false, fyiOnly: false, category: category, birthdayBudget: '', christmasBudget: '' });
            this.receivedGifts.forEach(rg => {
                if (rg.giverType === 'other' && rg.giverId === giverId) {
                    rg.giverType = 'person';
                    rg.giverId = newId;
                }
            });
            this.otherGivers = this.otherGivers.filter(g => g.id !== giverId);
            this.saveData();
            modal.remove();
            this.render();
        };
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    validateEventId(eventId) {
        // Never let a gift be saved pointing at an event that doesn't currently exist -
        // this is a hard safety net regardless of how a stale ID might reach this point.
        if (!eventId) return null;
        const parsed = parseInt(eventId);
        if (!parsed) return null;
        return this.events.some(e => e.id === parsed) ? parsed : null;
    }
    addReceivedGift(giftName, fromValue, fromNewText, eventId, price, notes, thankYouSent, receivedByPersonName) {
        if (!giftName) return alert('Enter gift name');
        let giverType, giverId;
        if (fromValue === '__new__') {
            const resolved = this.findOrCreateGiverByName(fromNewText, true);
            if (!resolved) return alert('Enter who gave this gift');
            giverType = resolved.giverType; giverId = resolved.giverId;
        } else if (fromValue && fromValue.indexOf(':') > -1) {
            const parts = fromValue.split(':');
            giverType = parts[0]; giverId = parseInt(parts[1]);
        } else {
            return alert('Select or enter who gave this gift');
        }
        const gid = Math.max(...this.receivedGifts.map(g => g.id), 0) + 1;
        this.receivedGifts.push({ id: gid, giftName: giftName, eventId: this.validateEventId(eventId), giverType: giverType, giverId: giverId, price: parseFloat(price) || 0, notes: notes || '', thankYouSent: thankYouSent || false, dateReceived: new Date().toISOString().split('T')[0], receivedByPersonName: receivedByPersonName || null });
        this.addingReceivedGift = false;
        this.receivedGiftFormState = { giftName: '', from: '', fromNewText: '', event: null, price: '', notes: '', thankYouSent: false, receivedBy: '' };
        this.saveData(); this.render();
    }
    updateReceivedGift(id, updates) { const g = this.receivedGifts.find(x => x.id === id); if (g) { if ('eventId' in updates) updates.eventId = this.validateEventId(updates.eventId); Object.assign(g, updates); } this.saveData(); this.render(); }
    deleteReceivedGift(id) { this.receivedGifts = this.receivedGifts.filter(g => g.id !== id); this.saveData(); this.render(); }
    expandReceivedGift(id) { this.expandedReceivedGift = this.expandedReceivedGift === id ? null : id; this.editingReceivedGift = null; this.render(); }
    toggleEditReceivedGift(id) { this.editingReceivedGift = this.editingReceivedGift === id ? null : id; this.render(); }
    toggleReceivedThankYou(id) { const g = this.receivedGifts.find(x => x.id === id); if (g) { g.thankYouSent = !g.thankYouSent; this.saveData(); this.render(); } }
    renderGiverSelectOptions(selectedValue) {
        let html = '<option value="">-- Select who gave this --</option>';
        const people = this.getSortedPeople();
        if (people.length > 0) {
            html += '<optgroup label="People">' + people.map(p => '<option value="person:' + p.id + '"' + (selectedValue === 'person:' + p.id ? ' selected' : '') + '>' + p.fullName + '</option>').join('') + '</optgroup>';
        }
        const givers = [...this.otherGivers].sort((a, b) => a.name.localeCompare(b.name));
        if (givers.length > 0) {
            html += '<optgroup label="Other Givers">' + givers.map(g => '<option value="other:' + g.id + '"' + (selectedValue === 'other:' + g.id ? ' selected' : '') + '>' + g.name + '</option>').join('') + '</optgroup>';
        }
        html += '<option value="__new__"' + (selectedValue === '__new__' ? ' selected' : '') + '>+ Add new giver...</option>';
        return html;
    }
    renderReceivedGiftForm() {
        const state = this.receivedGiftFormState;
        let html = '<div class="mb-4 p-4 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border);"><h3 class="font-semibold mb-3" style="color: var(--color-text);">Add Received Gift</h3>';
        html += '<input type="text" id="rgname" placeholder="Gift name" value="' + state.giftName + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);" oninput="window.app.receivedGiftFormState.giftName = this.value">';
        html += '<label style="display: block; margin-bottom: 6px; color: var(--color-text); font-size: 12px;">From</label><select id="rgfrom" onchange="window.app.receivedGiftFormState.from = this.value; window.app.render()" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);">' + this.renderGiverSelectOptions(state.from) + '</select>';
        if (state.from === '__new__') {
            html += '<input type="text" id="rgfromtext" placeholder="Their name" value="' + (state.fromNewText || '') + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);" oninput="window.app.receivedGiftFormState.fromNewText = this.value">';
        }
        const meAdamPeople = this.getMeAdamPeopleNames();
        if (state.receivedBy) {
            html += '<div style="margin-bottom: 8px; padding: 6px 10px; background-color: var(--color-secondary); border-radius: 4px; font-size: 12px; color: var(--color-text); display: flex; justify-content: space-between; align-items: center;"><span>Received by: <strong>' + state.receivedBy + '</strong></span>' + (meAdamPeople.length > 1 ? '<button onclick="window.app.receivedGiftFormState.receivedBy = \'\'; window.app.receivedGiftFormState.event = \'\'; window.app.render()" style="background: none; border: none; color: var(--color-accent); font-size: 11px; cursor: pointer; text-decoration: underline;">Change</button>' : '') + '</div>';
        } else if (meAdamPeople.length > 1) {
            html += '<label style="display: block; margin-bottom: 6px; color: var(--color-text); font-size: 12px;">Received by</label><select id="rgreceivedby" onchange="window.app.receivedGiftFormState.receivedBy = this.value; window.app.receivedGiftFormState.event = \'\'; window.app.render()" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">-- Select --</option>' + meAdamPeople.map(n => '<option value="' + n + '">' + n + '</option>').join('') + '</select>';
        } else if (meAdamPeople.length === 1) {
            state.receivedBy = meAdamPeople[0];
            html += '<div style="margin-bottom: 8px; padding: 6px 10px; background-color: var(--color-secondary); border-radius: 4px; font-size: 12px; color: var(--color-text);">Received by: <strong>' + meAdamPeople[0] + '</strong></div>';
        } else {
            html += '<p style="color: var(--color-text-muted); font-size: 12px; margin-bottom: 8px;">Add "Me" or "Adam" to your People list to track who a gift was for.</p>';
        }
        if (state.receivedBy) {
            const eventsForPerson = this.getReceivedGiftsRelevantEvents(state.receivedBy);
            html += '<select id="rgevent" onchange="window.app.receivedGiftFormState.event = this.value" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">Select Event (optional)</option>' + eventsForPerson.map(e => '<option value="' + e.id + '"' + (state.event == e.id ? ' selected' : '') + '>' + e.name + '</option>').join('') + '</select>';
        } else {
            html += '<select id="rgevent" style="display: none;"></select>';
        }
        html += '<input type="number" id="rgprice" placeholder="Value / Price (optional)" value="' + state.price + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);" oninput="window.app.receivedGiftFormState.price = this.value">';
        html += '<textarea id="rgnotes" placeholder="Notes" class="w-full p-2 rounded border mb-2" rows="2" style="background-color: var(--color-surface); border-color: var(--color-border);" oninput="window.app.receivedGiftFormState.notes = this.value">' + state.notes + '</textarea>';
        html += '<div class="mb-2"><input type="checkbox" id="rgthanks" ' + (state.thankYouSent ? 'checked' : '') + ' onchange="window.app.receivedGiftFormState.thankYouSent = this.checked"><label for="rgthanks" style="color: var(--color-text); margin-left: 8px;"> Thank you sent</label></div>';
        html += '<button onclick="const fromSel = document.getElementById(\'rgfrom\').value; const fromText = fromSel === \'__new__\' ? document.getElementById(\'rgfromtext\').value : \'\'; const evEl = document.getElementById(\'rgevent\'); window.app.addReceivedGift(document.getElementById(\'rgname\').value, fromSel, fromText, evEl ? evEl.value : \'\', document.getElementById(\'rgprice\').value, document.getElementById(\'rgnotes\').value, document.getElementById(\'rgthanks\').checked, window.app.receivedGiftFormState.receivedBy)" class="px-4 py-2 rounded text-white mr-2" style="background-color: var(--color-primary); color: var(--color-primary-text);">Add</button>';
        html += '<button onclick="window.app.addingReceivedGift = false; window.app.render()" class="px-4 py-2 rounded" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button>';
        html += '</div>';
        return html;
    }
    renderGivenGiftItem(g) {
        const isExp = this.expandedGift === g.id;
        const isEdit = this.editingGift === g.id;
        let html = '<div class="mb-3 swipe-item" data-swipe-item data-gift-id="' + g.id + '"><div class="swipe-item-content p-4 rounded-lg border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-border);"><div class="flex-1"><button onclick="window.app.expandGift(' + g.id + ')" class="w-full text-left"><h3 class="font-semibold" style="color: var(--color-text);">' + g.giftName + '</h3><p class="text-sm" style="color: var(--color-text-muted);">£' + g.price.toFixed(2) + ' • ' + g.personName + ' • ' + g.status + '</p></button>';
        if (isExp) {
            const event = this.events.find(e => e.id === g.eventId);
            if (isEdit) {
                const editPersonName = document.getElementById('eg_person_' + g.id) ? document.getElementById('eg_person_' + g.id).value : g.personName;
                const editPersonEvents = editPersonName ? this.events.filter(e => {
                    const person = this.people.find(p => p.fullName === editPersonName);
                    return person && (e.personId === person.id || e.people.some(ep => ep.name === editPersonName));
                }).sort((a, b) => {
                    const [dA, mA, yA] = a.date.split('-');
                    const [dB, mB, yB] = b.date.split('-');
                    return new Date(parseInt(yA), parseInt(mA) - 1, parseInt(dA)) - new Date(parseInt(yB), parseInt(mB) - 1, parseInt(dB));
                }) : [];
                html += '<div class="mt-3 pt-3 border-t" style="border-color: var(--color-border);"><input type="text" id="eg_name_' + g.id + '" value="' + g.giftName + '" placeholder="Gift name" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><select id="eg_person_' + g.id + '" onchange="window.app.render()" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">Select Person (optional)</option>' + this.getGiftablePeople().map(p => '<option value="' + p.fullName + '"' + (g.personName === p.fullName ? ' selected' : '') + '>' + p.fullName + '</option>').join('') + '</select>' + (editPersonName ? '<select id="eg_event_' + g.id + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">Select Event (optional)</option>' + editPersonEvents.map(e => '<option value="' + e.id + '"' + (g.eventId === e.id ? ' selected' : '') + '>' + e.name + '</option>').join('') + '</select>' : '') + '<input type="number" id="eg_price_' + g.id + '" value="' + g.price + '" placeholder="Price" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><input type="text" id="eg_url_' + g.id + '" value="' + g.url + '" placeholder="URL" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><div class="flex gap-2 mb-2"><select id="eg_shop_' + g.id + '" class="flex-1 p-2 rounded border" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">Select Shop</option>' + this.shops.map(s => '<option value="' + s + '"' + (g.shop === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select><button onclick="const shop = prompt(\'Enter new shop name:\'); if(shop) window.app.addShop(shop)" class="px-3 py-2 rounded text-white" style="background-color: var(--color-accent); color: white;">+</button></div><textarea id="eg_notes_' + g.id + '" placeholder="Notes" class="w-full p-2 rounded border mb-2" rows="2" style="background-color: var(--color-surface); border-color: var(--color-border);">' + g.notes + '</textarea><select id="eg_status_' + g.id + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><option value="idea"' + (g.status === 'idea' ? ' selected' : '') + '>Idea</option><option value="planned"' + (g.status === 'planned' ? ' selected' : '') + '>Planned</option><option value="bought"' + (g.status === 'bought' ? ' selected' : '') + '>Bought</option><option value="wrapped"' + (g.status === 'wrapped' ? ' selected' : '') + '>Wrapped</option><option value="gifted"' + (g.status === 'gifted' ? ' selected' : '') + '>Gifted</option></select><button onclick="const eventEl = document.getElementById(\'eg_event_' + g.id + '\'); window.app.updateGift(' + g.id + ', {giftName: document.getElementById(\'eg_name_' + g.id + '\').value, personName: document.getElementById(\'eg_person_' + g.id + '\').value, eventId: eventEl ? parseInt(eventEl.value) || null : null, price: parseFloat(document.getElementById(\'eg_price_' + g.id + '\').value) || 0, url: document.getElementById(\'eg_url_' + g.id + '\').value, shop: document.getElementById(\'eg_shop_' + g.id + '\').value, notes: document.getElementById(\'eg_notes_' + g.id + '\').value, status: document.getElementById(\'eg_status_' + g.id + '\').value}); window.app.editingGift = null; window.app.render();" class="px-4 py-2 rounded text-white mr-2" style="background-color: var(--color-primary); color: var(--color-primary-text);">Save</button><button onclick="window.app.toggleEditGift(' + g.id + ')" class="px-4 py-2 rounded" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button></div>';
            } else {
                html += '<div class="mt-3 pt-3 border-t" style="border-color: var(--color-border);"><div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs" style="color: var(--color-text-muted);">Event</p><p style="color: var(--color-text);">' + (event ? event.name : 'No event') + '</p></div>';
                if (g.url) {
                    html += '<div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs" style="color: var(--color-text-muted);">URL</p><p><a href="' + g.url + '" target="_blank" style="color: var(--color-accent);">View link</a></p></div>';
                }
                if (g.notes) {
                    html += '<div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs" style="color: var(--color-text-muted);">Notes</p><p style="color: var(--color-text);">' + g.notes + '</p></div>';
                }
                if (g.shop) {
                    html += '<div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs" style="color: var(--color-text-muted);">Shop</p><p style="color: var(--color-text);">' + g.shop + '</p></div>';
                }
            }
        }
        html += '</div></div><div class="swipe-edit" onclick="window.app.expandGift(' + g.id + '); window.app.editingGift = ' + g.id + '; window.app.render();">Edit</div><div class="swipe-delete" onclick="window.app.deleteGift(' + g.id + ')">Delete</div></div>';
        return html;
    }
    renderGroupHeader(label, count) {
        return '<div style="margin: 16px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid var(--color-border);"><p style="color: var(--color-text-muted); font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; margin: 0;">' + label + ' (' + count + ')</p></div>';
    }
    eventDateSortKey(event) {
        if (!event) return '9999-99-99';
        const parts = event.date.split('-'); // DD-MM-YYYY
        return parts[2] + '-' + parts[1] + '-' + parts[0];
    }
    renderGroupedGivenGifts(items, groupBy) {
        const groups = {};
        items.forEach(g => {
            let key, label, sortKey;
            if (groupBy === 'event') {
                const event = g.eventId ? this.events.find(e => e.id === g.eventId) : null;
                key = g.eventId || 'none';
                label = event ? event.name : 'No Event';
                sortKey = this.eventDateSortKey(event);
            } else if (groupBy === 'person') {
                key = g.personName || 'unassigned';
                label = g.personName || 'Unassigned';
                sortKey = label.toLowerCase();
            } else {
                const order = { idea: 0, planned: 1, bought: 2, wrapped: 3, gifted: 4 };
                key = g.status;
                label = g.status.charAt(0).toUpperCase() + g.status.slice(1);
                sortKey = String(order[g.status] !== undefined ? order[g.status] : 9);
            }
            if (!groups[key]) groups[key] = { label: label, sortKey: sortKey, items: [] };
            groups[key].items.push(g);
        });
        let html = '';
        Object.values(groups).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).forEach(group => {
            html += this.renderGroupHeader(group.label, group.items.length);
            group.items.forEach(g => { html += this.renderGivenGiftItem(g); });
        });
        return html;
    }
    renderGroupedReceivedGifts(items, groupBy) {
        const groups = {};
        items.forEach(g => {
            let key, label, sortKey;
            if (groupBy === 'event') {
                const event = g.eventId ? this.events.find(e => e.id === g.eventId) : null;
                key = g.eventId || 'none';
                label = event ? event.name : 'No Event';
                sortKey = this.eventDateSortKey(event);
            } else if (groupBy === 'receivedBy') {
                key = g.receivedByPersonName || 'unassigned';
                label = g.receivedByPersonName || 'Unassigned';
                sortKey = label.toLowerCase();
            } else if (groupBy === 'from') {
                const giverInfo = this.getGiverInfo(g);
                key = g.giverType + ':' + g.giverId;
                label = giverInfo.name;
                sortKey = label.toLowerCase();
            } else {
                key = g.thankYouSent ? 'yes' : 'no';
                label = g.thankYouSent ? 'Thanked' : 'Not Thanked';
                sortKey = g.thankYouSent ? '0' : '1';
            }
            if (!groups[key]) groups[key] = { label: label, sortKey: sortKey, items: [] };
            groups[key].items.push(g);
        });
        let html = '';
        Object.values(groups).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).forEach(group => {
            html += this.renderGroupHeader(group.label, group.items.length);
            group.items.forEach(g => { html += this.renderReceivedGiftItem(g); });
        });
        return html;
    }
    renderReceivedGiftItem(g) {
        const isExp = this.expandedReceivedGift === g.id;
        const isEdit = this.editingReceivedGift === g.id;
        const event = g.eventId ? this.events.find(e => e.id === g.eventId) : null;
        const giverInfo = this.getGiverInfo(g);
        const relevantPeopleForEdit = event ? this.getRelevantPeopleForEvent(event) : [];
        let html = '<div class="mb-3 swipe-item" data-swipe-item data-received-gift-id="' + g.id + '"><div class="swipe-item-content p-4 rounded-lg border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-border);"><div class="flex-1"><button onclick="window.app.expandReceivedGift(' + g.id + ')" class="w-full text-left"><h3 class="font-semibold" style="color: var(--color-text);">' + g.giftName + '</h3><p class="text-sm" style="color: var(--color-text-muted);">' + (g.receivedByPersonName ? 'For ' + g.receivedByPersonName + ' • ' : '') + 'From ' + giverInfo.name + (g.price ? ' • £' + g.price.toFixed(2) : '') + ' • ' + (g.thankYouSent ? '<span style="color: var(--color-success); font-weight: 500;">Thanked</span>' : '<span style="color: var(--color-warning); font-weight: 500;">Not thanked</span>') + '</p></button>';
        if (isExp) {
            if (isEdit) {
                const currentValue = g.giverType + ':' + g.giverId;
                html += '<div class="mt-3 pt-3 border-t" style="border-color: var(--color-border);">'
                    + '<input type="text" id="erg_name_' + g.id + '" value="' + g.giftName + '" placeholder="Gift name" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);">'
                    + '<label style="display: block; margin-bottom: 6px; color: var(--color-text); font-size: 12px;">From</label><select id="erg_from_' + g.id + '" onchange="document.getElementById(\'erg_fromtext_' + g.id + '\').style.display = this.value === \'__new__\' ? \'block\' : \'none\';" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);">' + this.renderGiverSelectOptions(currentValue) + '</select>'
                    + '<input type="text" id="erg_fromtext_' + g.id + '" value="" placeholder="Their name (only if you picked + Add new giver above)" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); display: none;">'
                    + '<select id="erg_event_' + g.id + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">Select Event (optional)</option>' + this.getReceivedGiftsRelevantEvents(g.receivedByPersonName).map(e => '<option value="' + e.id + '"' + (g.eventId === e.id ? ' selected' : '') + '>' + e.name + '</option>').join('') + '</select>'
                    + (relevantPeopleForEdit.length > 1 ? '<label style="display: block; margin-bottom: 6px; color: var(--color-text); font-size: 12px;">Received by</label><select id="erg_receivedby_' + g.id + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">-- Select --</option>' + relevantPeopleForEdit.map(n => '<option value="' + n + '"' + (g.receivedByPersonName === n ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' : '')
                    + '<input type="number" id="erg_price_' + g.id + '" value="' + g.price + '" placeholder="Value" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);">'
                    + '<textarea id="erg_notes_' + g.id + '" placeholder="Notes" class="w-full p-2 rounded border mb-2" rows="2" style="background-color: var(--color-surface); border-color: var(--color-border);">' + g.notes + '</textarea>'
                    + '<div class="mb-2"><input type="checkbox" id="erg_thanks_' + g.id + '" ' + (g.thankYouSent ? 'checked' : '') + '><label for="erg_thanks_' + g.id + '" style="color: var(--color-text); margin-left: 8px;"> Thank you sent</label></div>'
                    + '<button onclick="const fromSel = document.getElementById(\'erg_from_' + g.id + '\').value; let giverType, giverId; if (fromSel === \'__new__\') { const resolved = window.app.findOrCreateGiverByName(document.getElementById(\'erg_fromtext_' + g.id + '\').value, true); if(!resolved) { alert(\'Enter a name\'); return; } giverType = resolved.giverType; giverId = resolved.giverId; } else { const parts = fromSel.split(\':\'); giverType = parts[0]; giverId = parseInt(parts[1]); } const rbEl = document.getElementById(\'erg_receivedby_' + g.id + '\'); const receivedBy = rbEl ? rbEl.value : (' + (g.receivedByPersonName ? "'" + g.receivedByPersonName.replace(/'/g, "\\'") + "'" : 'null') + '); window.app.updateReceivedGift(' + g.id + ', {giftName: document.getElementById(\'erg_name_' + g.id + '\').value, giverType: giverType, giverId: giverId, eventId: parseInt(document.getElementById(\'erg_event_' + g.id + '\').value) || null, price: parseFloat(document.getElementById(\'erg_price_' + g.id + '\').value) || 0, notes: document.getElementById(\'erg_notes_' + g.id + '\').value, thankYouSent: document.getElementById(\'erg_thanks_' + g.id + '\').checked, receivedByPersonName: receivedBy || null}); window.app.editingReceivedGift = null; window.app.render();" class="px-4 py-2 rounded text-white mr-2" style="background-color: var(--color-primary); color: var(--color-primary-text);">Save</button>'
                    + '<button onclick="window.app.toggleEditReceivedGift(' + g.id + ')" class="px-4 py-2 rounded" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button>'
                    + '</div>';
            } else {
                html += '<div class="mt-3 pt-3 border-t" style="border-color: var(--color-border);">';
                html += '<div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs" style="color: var(--color-text-muted);">Event</p><p style="color: var(--color-text);">' + (event ? event.name : 'No event') + '</p></div>';
                if (g.receivedByPersonName) html += '<div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs" style="color: var(--color-text-muted);">Received by</p><p style="color: var(--color-text);">' + g.receivedByPersonName + '</p></div>';
                html += '<div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs" style="color: var(--color-text-muted);">From</p><p style="color: var(--color-text);">' + giverInfo.name + (giverInfo.type === 'person' ? ' (linked to People)' : ' (Other Giver)') + '</p></div>';
                if (g.notes) html += '<div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs" style="color: var(--color-text-muted);">Notes</p><p style="color: var(--color-text);">' + g.notes + '</p></div>';
                html += '<div class="mb-2"><input type="checkbox" id="rgt_' + g.id + '" ' + (g.thankYouSent ? 'checked' : '') + ' onchange="window.app.toggleReceivedThankYou(' + g.id + ')"><label for="rgt_' + g.id + '" style="color: var(--color-text); margin-left: 8px;"> Thank you sent</label></div>';
                html += '</div>';
            }
        }
        html += '</div></div><div class="swipe-edit" onclick="window.app.expandReceivedGift(' + g.id + '); window.app.editingReceivedGift = ' + g.id + '; window.app.render();">Edit</div><div class="swipe-delete" onclick="window.app.deleteReceivedGift(' + g.id + ')">Delete</div></div>';
        return html;
    }
    areAllEventGiftsGifted(eid) { 
        const gifts = this.getGiftsForEvent(eid);
        if (gifts.length === 0) return false;
        return gifts.every(g => g.status === 'gifted');
    }
    isEventUpcoming(e) { const p = e.date.split('-'); return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])) >= new Date(); }
    getSortedPeople() { return [...this.people].sort((a, b) => a.fullName.localeCompare(b.fullName)); }
    getGiftablePeople() { return this.getSortedPeople().filter(p => !p.fyiOnly); }
    getEffectiveEventPeople(e) {
        // Computes the current correct people list for an event on the fly, rather than
        // relying on the possibly-stale e.people snapshot (which is only refreshed for
        // birthday/christmas events when that event happens to be expanded and rendered).
        if (e.type === 'christmas') {
            const christmasYear = e.year;
            const christmasDate = new Date(christmasYear, 11, 25);
            const dynamicPeople = this.people.filter(p => {
                if (!p.includeInChristmas) return false;
                const [day, month] = p.birthday.split('-');
                const birthdayInYear = new Date(christmasYear, parseInt(month) - 1, parseInt(day));
                if (e.excludedPeople && e.excludedPeople.includes(p.fullName)) return false;
                return birthdayInYear <= christmasDate;
            }).map(p => ({ name: p.fullName, budget: 0 }));
            const manualPeopleNames = (e.people || []).map(p => p.name);
            const dynamicPeopleNotInManual = dynamicPeople.filter(p => !manualPeopleNames.includes(p.name));
            return [...(e.people || []), ...dynamicPeopleNotInManual];
        } else if (e.type === 'birthday' && e.personId) {
            const person = this.people.find(p => p.id === e.personId);
            return person ? [{ name: person.fullName, budget: 0 }] : [];
        }
        return e.people || [];
    }
    hasUnassignedPeople(event) {
        const effectivePeople = this.getEffectiveEventPeople(event);
        if (!effectivePeople || effectivePeople.length === 0) return false;
        return effectivePeople.some(p => {
            const person = this.people.find(pp => pp.fullName === p.name);
            if (person && person.messageOnly) return false; // message-only people are never expected to get a gift assignment
            const assignedGifts = event.giftAssignments ? event.giftAssignments.filter(ga => ga.personName === p.name) : [];
            return assignedGifts.length === 0;
        });
    }
    
    getSortedEvents() { return [...this.events].sort((a, b) => { const [dA, mA, yA] = a.date.split('-'); const [dB, mB, yB] = b.date.split('-'); return new Date(parseInt(yA), parseInt(mA) - 1, parseInt(dA)) - new Date(parseInt(yB), parseInt(mB) - 1, parseInt(dB)); }); }
    getMonthYear(dateStr) { if (!dateStr) return ''; const p = dateStr.split('-'); return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).toLocaleDateString('en-US', {month: 'long', year: 'numeric'}); }
    getTotalSpent() { return this.gifts.reduce((s, g) => s + g.price, 0); }
    getAverageBirthdaySpend() {
        const birthdayEvents = this.events.filter(e => e.type === 'birthday');
        if (birthdayEvents.length === 0) return 0;
        const spent = birthdayEvents.reduce((s, e) => s + this.getGiftsForEvent(e.id).reduce((s2, g) => s2 + g.price, 0), 0);
        return (spent / birthdayEvents.length).toFixed(2);
    }
    getAverageChristmasSpend() {
        const christmasEvents = this.events.filter(e => e.type === 'christmas');
        if (christmasEvents.length === 0) return 0;
        const spent = christmasEvents.reduce((s, e) => s + this.getGiftsForEvent(e.id).reduce((s2, g) => s2 + g.price, 0), 0);
        return (spent / christmasEvents.length).toFixed(2);
    }
    getTopGiftees() {
        const gpp = {};
        this.gifts.forEach(g => {
            if (g.personName) {
                if (!gpp[g.personName]) gpp[g.personName] = { count: 0, spent: 0 };
                gpp[g.personName].count++;
                gpp[g.personName].spent += g.price;
            }
        });
        return Object.entries(gpp).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.spent - a.spent).slice(0, 5);
    }
    getTopGivers() {
        const stats = {};
        this.receivedGifts.forEach(g => {
            const key = g.giverType + ':' + g.giverId;
            if (!stats[key]) stats[key] = { giverType: g.giverType, giverId: g.giverId, count: 0, spent: 0 };
            stats[key].count++;
            stats[key].spent += g.price;
        });
        return Object.values(stats).map(s => ({ ...s, name: this.getGiverInfo({ giverType: s.giverType, giverId: s.giverId }).name })).sort((a, b) => b.spent - a.spent).slice(0, 5);
    }
    showGiverHistoryModal(giverType, giverId) {
        const name = this.getGiverInfo({ giverType: giverType, giverId: giverId }).name;
        const gifts = this.receivedGifts.filter(g => g.giverType === giverType && g.giverId === giverId).sort((a, b) => (a.dateReceived || '').localeCompare(b.dateReceived || ''));
        let content = '<div style="padding: 20px;"><h2 style="margin-bottom: 16px; color: #2D3436;">Gifts from ' + name + '</h2>';
        if (gifts.length === 0) {
            content += '<p style="color: #636E72;">No gifts recorded.</p>';
        } else {
            const total = gifts.reduce((s, g) => s + g.price, 0);
            content += '<p style="color: #636E72; margin-bottom: 12px; font-size: 13px;">' + gifts.length + ' gift(s) • £' + total.toFixed(2) + ' total</p>';
            content += '<table style="width: 100%; border-collapse: collapse; color: #2D3436;"><tr style="background-color: #F5F6FA; border-bottom: 2px solid #DFE6E9;"><th style="padding: 8px; text-align: left;">Gift</th><th style="padding: 8px; text-align: left;">Event</th><th style="padding: 8px; text-align: center;">Value</th><th style="padding: 8px; text-align: center;">Thanked</th></tr>';
            gifts.forEach(g => {
                const event = this.events.find(e => e.id === g.eventId);
                content += '<tr style="border-bottom: 1px solid #DFE6E9;"><td style="padding: 8px;">' + g.giftName + '</td><td style="padding: 8px;">' + (event ? event.name : '-') + '</td><td style="padding: 8px; text-align: center;">£' + g.price.toFixed(2) + '</td><td style="padding: 8px; text-align: center;">' + (g.thankYouSent ? 'Yes' : 'No') + '</td></tr>';
            });
            content += '</table>';
        }
        content += '<div style="margin-top: 20px; text-align: right;"><button onclick="document.querySelector(\'[data-modal-giver-history]\').remove();" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FF6B9D; color: white; cursor: pointer; font-weight: 500;">Close</button></div></div>';
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        dialog.innerHTML = content;
        modal.setAttribute('data-modal-giver-history', 'true');
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    showRecipientHistoryModal(personName) {
        const gifts = this.gifts.filter(g => g.personName === personName).sort((a, b) => {
            const eventA = this.events.find(e => e.id === a.eventId);
            const eventB = this.events.find(e => e.id === b.eventId);
            return this.eventDateSortKey(eventA).localeCompare(this.eventDateSortKey(eventB));
        });
        let content = '<div style="padding: 20px;"><h2 style="margin-bottom: 16px; color: #2D3436;">Gifts for ' + personName + '</h2>';
        if (gifts.length === 0) {
            content += '<p style="color: #636E72;">No gifts recorded.</p>';
        } else {
            const total = gifts.reduce((s, g) => s + g.price, 0);
            content += '<p style="color: #636E72; margin-bottom: 12px; font-size: 13px;">' + gifts.length + ' gift(s) • £' + total.toFixed(2) + ' total</p>';
            content += '<table style="width: 100%; border-collapse: collapse; color: #2D3436;"><tr style="background-color: #F5F6FA; border-bottom: 2px solid #DFE6E9;"><th style="padding: 8px; text-align: left;">Gift</th><th style="padding: 8px; text-align: left;">Event</th><th style="padding: 8px; text-align: center;">Value</th><th style="padding: 8px; text-align: center;">Status</th></tr>';
            gifts.forEach(g => {
                const event = this.events.find(e => e.id === g.eventId);
                content += '<tr style="border-bottom: 1px solid #DFE6E9;"><td style="padding: 8px;">' + g.giftName + '</td><td style="padding: 8px;">' + (event ? event.name : '-') + '</td><td style="padding: 8px; text-align: center;">£' + g.price.toFixed(2) + '</td><td style="padding: 8px; text-align: center;">' + g.status + '</td></tr>';
            });
            content += '</table>';
        }
        content += '<div style="margin-top: 20px; text-align: right;"><button onclick="document.querySelector(\'[data-modal-recipient-history]\').remove();" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FF6B9D; color: white; cursor: pointer; font-weight: 500;">Close</button></div></div>';
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        dialog.innerHTML = content;
        modal.setAttribute('data-modal-recipient-history', 'true');
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    showEventTypeSpendModal(eventType) {
        const label = eventType === 'christmas' ? 'Christmas' : 'Birthday';
        let events = this.events.filter(e => e.type === eventType);
        events = events.sort((a, b) => {
            const [dA, mA, yA] = a.date.split('-');
            const [dB, mB, yB] = b.date.split('-');
            return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
        });
        let content = '<div style="padding: 20px;"><h2 style="margin-bottom: 16px; color: #2D3436;">' + label + ' Spend by ' + (eventType === 'christmas' ? 'Year' : 'Event') + '</h2>';
        if (events.length === 0) {
            content += '<p style="color: #636E72;">No ' + label.toLowerCase() + ' events tracked yet.</p>';
        } else {
            let runningTotal = 0;
            content += '<table style="width: 100%; border-collapse: collapse; color: #2D3436;"><tr style="background-color: #F5F6FA; border-bottom: 2px solid #DFE6E9;"><th style="padding: 8px; text-align: left;">' + label + '</th><th style="padding: 8px; text-align: center;">Household Spend</th></tr>';
            events.forEach(e => {
                const spent = this.getGiftsForEvent(e.id).reduce((s, g) => s + g.price, 0);
                runningTotal += spent;
                content += '<tr style="border-bottom: 1px solid #DFE6E9;"><td style="padding: 8px;">' + e.name + '</td><td style="padding: 8px; text-align: center;">£' + spent.toFixed(2) + '</td></tr>';
            });
            content += '</table>';
            content += '<p style="margin-top: 12px; color: #636E72; font-size: 13px;">Average: £' + (runningTotal / events.length).toFixed(2) + ' across ' + events.length + (eventType === 'christmas' ? (events.length > 1 ? ' years' : ' year') : (events.length > 1 ? ' birthdays' : ' birthday')) + '</p>';
        }
        content += '<div style="margin-top: 20px; text-align: right;"><button onclick="document.querySelector(\'[data-modal-event-spend]\').remove();" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FF6B9D; color: white; cursor: pointer; font-weight: 500;">Close</button></div></div>';
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        dialog.innerHTML = content;
        modal.setAttribute('data-modal-event-spend', 'true');
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    getGiftStatusBreakdown() {
        const order = ['idea', 'planned', 'bought', 'wrapped', 'gifted'];
        const counts = {};
        order.forEach(s => { counts[s] = 0; });
        this.gifts.forEach(g => { if (counts[g.status] !== undefined) counts[g.status]++; });
        const total = this.gifts.length;
        return { breakdown: order.map(s => ({ status: s, label: s.charAt(0).toUpperCase() + s.slice(1), count: counts[s] })), total: total, giftedCount: counts.gifted };
    }
    getOutstandingCounts() {
        return {
            toBuy: this.gifts.filter(g => g.status === 'idea' || g.status === 'planned').length,
            thankYous: this.receivedGifts.filter(g => !g.thankYouSent).length,
            eventsNeedingGifts: this.events.filter(e => this.isEventUpcoming(e) && this.hasUnassignedPeople(e)).length
        };
    }
    exportToCSV() {
        const escapeCSV = (str) => {
            if (!str) return '';
            str = String(str);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };
        
        let csv = 'GIFT TRACKER EXPORT\n';
        csv += 'Export Date: ' + new Date().toLocaleString() + '\n\n';
        
        csv += '=== PEOPLE ===\n';
        csv += 'ID,Full Name,Birthday (DD-MM),Birth Year,Likes,Dislikes,Notes,Message Only,FYI Only,Include in Christmas\n';
        this.people.forEach(p => {
            csv += escapeCSV(p.id) + ',' + escapeCSV(p.fullName) + ',' + escapeCSV(p.birthday) + ',' + escapeCSV(p.birthYear) + ',' + escapeCSV(p.likes || '') + ',' + escapeCSV(p.dislikes || '') + ',' + escapeCSV(p.notes || '') + ',' + (p.messageOnly ? 'Yes' : 'No') + ',' + (p.fyiOnly ? 'Yes' : 'No') + ',' + (p.includeInChristmas ? 'Yes' : 'No') + '\n';
        });
        
        csv += '\n=== EVENTS ===\n';
        csv += 'ID,Type,Name,Date (DD-MM-YYYY),Budget,Notes,Person ID,Person Name,Year,Messaged\n';
        this.events.forEach(e => {
            csv += escapeCSV(e.id) + ',' + escapeCSV(e.type) + ',' + escapeCSV(e.name) + ',' + escapeCSV(e.date) + ',' + escapeCSV(e.budget) + ',' + escapeCSV(e.notes || '') + ',' + escapeCSV(e.personId || '') + ',' + escapeCSV(e.personName || '') + ',' + escapeCSV(e.year) + ',' + (e.messaged ? 'Yes' : 'No') + '\n';
        });
        
        csv += '\n=== GIFTS ===\n';
        csv += 'ID,Gift Name,Person Name,Event ID,Event Name,Status,Price,Shop,URL,Notes,Purchase Year\n';
        this.gifts.forEach(g => {
            const event = this.events.find(e => e.id === g.eventId);
            const eventName = event ? event.name : '';
            csv += escapeCSV(g.id) + ',' + escapeCSV(g.giftName) + ',' + escapeCSV(g.personName || '') + ',' + escapeCSV(g.eventId || '') + ',' + escapeCSV(eventName) + ',' + escapeCSV(g.status) + ',' + escapeCSV(g.price) + ',' + escapeCSV(g.shop || '') + ',' + escapeCSV(g.url || '') + ',' + escapeCSV(g.notes || '') + ',' + escapeCSV(g.purchaseYear || new Date().getFullYear()) + '\n';
        });
        
        csv += '\n=== GIFT ASSIGNMENTS (Event-Gift-Person Links) ===\n';
        csv += 'Event ID,Event Name,Gift ID,Gift Name,Person Name\n';
        this.events.forEach(e => {
            if (e.giftAssignments && e.giftAssignments.length > 0) {
                e.giftAssignments.forEach(ga => {
                    const gift = this.gifts.find(g => g.id === ga.giftId);
                    const giftName = gift ? gift.giftName : '';
                    csv += escapeCSV(e.id) + ',' + escapeCSV(e.name) + ',' + escapeCSV(ga.giftId) + ',' + escapeCSV(giftName) + ',' + escapeCSV(ga.personName) + '\n';
                });
            }
        });
        
        csv += '\n=== OTHER GIVERS ===\n';
        csv += 'ID,Name\n';
        this.otherGivers.forEach(g => {
            csv += escapeCSV(g.id) + ',' + escapeCSV(g.name) + '\n';
        });
        
        csv += '\n=== RECEIVED GIFTS ===\n';
        csv += 'ID,Gift Name,Received By,From,Giver Type,Giver ID,Event ID,Event Name,Price,Thank You Sent,Date Received,Notes\n';
        this.receivedGifts.forEach(g => {
            const event = this.events.find(e => e.id === g.eventId);
            const eventName = event ? event.name : '';
            const giverInfo = this.getGiverInfo(g);
            csv += escapeCSV(g.id) + ',' + escapeCSV(g.giftName) + ',' + escapeCSV(g.receivedByPersonName || '') + ',' + escapeCSV(giverInfo.name) + ',' + escapeCSV(g.giverType || '') + ',' + escapeCSV(g.giverId || '') + ',' + escapeCSV(g.eventId || '') + ',' + escapeCSV(eventName) + ',' + escapeCSV(g.price) + ',' + (g.thankYouSent ? 'Yes' : 'No') + ',' + escapeCSV(g.dateReceived || '') + ',' + escapeCSV(g.notes || '') + '\n';
        });
        
        const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'gift-tracker-' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    importFromPaste(pasteText) {
        try {
            const lines = pasteText.trim().split('\n');
            
            if (lines.length < 1) throw new Error('No data pasted');
            
            let headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
            let startRow = 0;
            
            const knownHeaders = ['fullname', 'birthday', 'likes', 'dislikes', 'notes', 'giftname', 'personname', 'status', 'price', 'id', 'url', 'eventname'];
            const isHeaderRow = headers.some(h => knownHeaders.includes(h));
            
            console.log('First row headers:', headers);
            console.log('Is header row?', isHeaderRow);
            
            if (!isHeaderRow) {
                console.log('First row appears to be data, not headers. Auto-detecting...');
                if (lines[0].includes('1990') || lines[0].includes('2000') || lines[0].includes('-')) {
                    headers = ['id', 'fullname', 'birthday', 'likes', 'dislikes', 'notes'];
                    startRow = 0;
                }
            } else {
                startRow = 1;
            }
            
            console.log('Using headers:', headers);
            console.log('Starting data from row:', startRow);
            
            let peopleImported = 0;
            let giftsImported = 0;
            let report = [];
            
            lines.slice(startRow).forEach((line, idx) => {
                const rowNum = startRow + idx + 1;
                if (!line.trim()) {
                    report.push('Warning — Row ' + rowNum + ': Empty row - SKIPPED');
                    return;
                }
                
                try {
                    const values = line.split('\t').map(v => v.trim());
                    const row = {};
                    headers.forEach((h, i) => { 
                        row[h] = values[i];
                    });
                    
                    console.log('Row ' + rowNum + ' parsed:', row);
                    
                    const fullName = row.fullname;
                    let birthday = row.birthday;
                    const likes = row.likes;
                    const dislikes = row.dislikes;
                    const notes = row.notes;
                    
                    if (fullName) {
                        let year = new Date().getFullYear();
                        let bdayStr = '01-01';
                        
                        if (birthday && birthday.trim()) {
                            if (birthday.includes('-') && birthday.includes(' ')) {
                                const parts = birthday.split(' ')[0].split('-');
                                if (parts.length === 3) {
                                    year = parseInt(parts[0]);
                                    bdayStr = String(parseInt(parts[2])).padStart(2, '0') + '-' + String(parseInt(parts[1])).padStart(2, '0');
                                }
                            } else if (birthday.includes('-')) {
                                const parts = birthday.split('-');
                                if (parts.length === 3) {
                                    year = parseInt(parts[0]);
                                    bdayStr = String(parseInt(parts[2])).padStart(2, '0') + '-' + String(parseInt(parts[1])).padStart(2, '0');
                                }
                            }
                            report.push('OK — Row ' + rowNum + ': Person "' + fullName + '" (DOB: ' + bdayStr + ') imported');
                        } else {
                            report.push('OK — Row ' + rowNum + ': Person "' + fullName + '" (no birthday) imported');
                        }
                        
                        this.importPerson({fullName, birthday: bdayStr, birthYear: year, likes, dislikes, notes});
                        peopleImported++;
                    } else {
                        report.push('Warning — Row ' + rowNum + ': Missing fullname - SKIPPED');
                    }
                    
                    const giftName = row.giftname;
                    const personName = row.personname;
                    
                    if (giftName && personName) {
                        this.importGift({giftName, personName, status: row.status || 'not purchased', price: row.price || 0});
                        giftsImported++;
                        report.push('OK — Row ' + rowNum + ': Gift "' + giftName + '" for "' + personName + '" imported');
                    }
                } catch (e) {
                    report.push('Error — Row ' + rowNum + ': ' + e.message);
                }
            });
            
            this.saveData();
            
            let msg = 'PASTE IMPORT REPORT\n\nImported: ' + peopleImported + ' people, ' + giftsImported + ' gifts\n\nDETAILS:\n' + report.join('\n');
            
            if (msg.length > 2000) {
                alert('Import complete!\n\nPeople: ' + peopleImported + '\nGifts: ' + giftsImported + '\n\nFirst 15 rows:\n' + report.slice(0, 15).join('\n'));
                console.log(msg);
            } else {
                alert(msg);
            }
            
            this.render();
        } catch (err) {
            alert('Paste Import Error:\n\n' + err.message + '\n\nMake sure:\n• Data is tab-separated (columns separated by tabs)\n• Can include or exclude header row\n• Birthday format: YYYY-MM-DD HH:MM:SS or YYYY-MM-DD\n• Paste exact content from Excel');
        }
    }
    showPasteModal() {
        this.showPromptModal('Paste your Excel data below (tab-separated)', '', (text) => {
            if (text && text.trim()) {
                this.importFromPaste(text);
            }
        }, 'Paste Data', true);
    }

    importData(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                if (file.name.endsWith('.csv')) {
                    this.importCSV(data);
                } else if (file.name.endsWith('.xlsx')) {
                    this.waitForXLSX(data, file.name, 0);
                } else {
                    alert('Error: File must be CSV or XLSX');
                }
            } catch (err) {
                alert('Import Error:\n\n' + err.message);
            }
        };
        reader.onerror = () => {
            alert('Error reading file. Make sure it\'s a valid CSV or XLSX file.');
        };
        reader.readAsArrayBuffer(file);
    }
    waitForXLSX(data, filename, attempts) {
        if (attempts > 30) {
            alert('XLSX library failed to load after 15 seconds.\n\nThis is a technical issue with the library loading from the internet.\n\nWorkaround: Use CSV import instead\n\nTo convert XLSX to CSV:\n1. Email yourself the file\n2. Open in Google Sheets (sheets.google.com)\n3. File → Download → CSV\n4. Import the CSV here\n\nOr manually add your data in the app.');
            console.error('XLSX library failed to load. Available libraries:', Object.keys(window).filter(k => k.includes('XLSX') || k.includes('xlsx')));
            return;
        }
        if (typeof XLSX !== 'undefined' && XLSX.read) {
            console.log('XLSX library ready, importing...');
            this.importXLSX(data);
        } else {
            console.log('⏳ Waiting for XLSX library... attempt ' + (attempts + 1) + '/30, XLSX type: ' + typeof XLSX);
            setTimeout(() => this.waitForXLSX(data, filename, attempts + 1), 500);
        }
    }
    importCSV(data) {
        try {
            const text = new TextDecoder().decode(data);
            const lines = text.trim().split('\n');
            
            if (lines.length < 1) throw new Error('CSV file is empty');
            
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            console.log('CSV Headers found:', headers);
            
            let peopleImported = 0;
            let giftsImported = 0;
            let report = [];
            
            lines.slice(1).forEach((line, idx) => {
                const rowNum = idx + 2;
                if (!line.trim()) {
                    report.push('Warning — Row ' + rowNum + ': Empty row - SKIPPED');
                    return;
                }
                
                try {
                    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const row = {};
                    headers.forEach((h, i) => { row[h] = values[i]; });
                    
                    const fullName = row.fullname;
                    const birthday = row.birthday;
                    const giftName = row.giftname;
                    const personName = row.personname;
                    
                    if (fullName && birthday) {
                        this.importPerson(row);
                        peopleImported++;
                        report.push('OK — Row ' + rowNum + ': Person "' + fullName + '" imported');
                    } else if (fullName || birthday) {
                        report.push('Warning — Row ' + rowNum + ': Missing ' + (!fullName ? 'fullname' : 'birthday') + ' - SKIPPED');
                    }
                    
                    if (giftName && personName) {
                        this.importGift(row);
                        giftsImported++;
                        report.push('OK — Row ' + rowNum + ': Gift "' + giftName + '" for "' + personName + '" imported');
                    } else if (giftName || personName) {
                        report.push('Warning — Row ' + rowNum + ': Missing ' + (!giftName ? 'giftname' : 'personname') + ' - SKIPPED');
                    }
                } catch (e) {
                    report.push('Error — Row ' + rowNum + ': ' + e.message);
                }
            });
            
            this.saveData();
            
            let msg = 'CSV IMPORT REPORT\n\nImported: ' + peopleImported + ' people, ' + giftsImported + ' gifts\n\nDETAILS:\n' + report.join('\n');
            
            if (msg.length > 2000) {
                alert('Import complete!\n\nPeople: ' + peopleImported + '\nGifts: ' + giftsImported + '\n\nFull report:\n' + report.slice(0, 15).join('\n') + '\n\n(See console for full details)');
                console.log(msg);
            } else {
                alert(msg);
            }
            
            this.render();
        } catch (err) {
            alert('CSV Import Error:\n\n' + err.message + '\n\nMake sure:\n• First row contains headers (lowercase): fullname, birthday, giftname, personname\n• Each row is properly comma-separated');
        }
    }
    importXLSX(data) {
        try {
            if (typeof XLSX === 'undefined') throw new Error('XLSX library failed to load');
            
            const wb = XLSX.read(data, {type: 'array'});
            
            if (!wb.SheetNames || wb.SheetNames.length === 0) throw new Error('No sheets found in workbook');
            
            let peopleImported = 0;
            let giftsImported = 0;
            let report = [];
            
            wb.SheetNames.forEach(sheetName => {
                try {
                    const ws = wb.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(ws, {defval: ''});
                    
                    console.log('Sheet "' + sheetName + '" has ' + rows.length + ' rows');
                    
                    if (rows.length > 0) {
                        console.log('First row keys:', Object.keys(rows[0]));
                    }
                    
                    rows.forEach((row, idx) => {
                        const rowNum = idx + 2;
                        try {
                            const fullName = row.fullName || row.fullname;
                            const birthday = row.birthday || row.Birthday;
                            const giftName = row.giftName || row.giftname;
                            const personName = row.personName || row.personname;
                            
                            if (fullName && birthday) {
                                this.importPerson(row);
                                peopleImported++;
                                report.push('OK — Row ' + rowNum + ' (' + sheetName + '): Person "' + fullName + '" imported');
                            } else if (fullName || birthday) {
                                report.push('Warning — Row ' + rowNum + ' (' + sheetName + '): Missing ' + (!fullName ? 'fullName' : 'birthday') + ' - SKIPPED');
                            }
                            
                            if (giftName && personName) {
                                this.importGift(row);
                                giftsImported++;
                                report.push('OK — Row ' + rowNum + ' (' + sheetName + '): Gift "' + giftName + '" for "' + personName + '" imported');
                            } else if (giftName || personName) {
                                report.push('Warning — Row ' + rowNum + ' (' + sheetName + '): Missing ' + (!giftName ? 'giftName' : 'personName') + ' - SKIPPED');
                            }
                        } catch (e) {
                            report.push('Error — Row ' + rowNum + ' (' + sheetName + '): ' + e.message);
                        }
                    });
                } catch (e) {
                    report.push('Error — Sheet "' + sheetName + '": ' + e.message);
                }
            });
            
            this.saveData();
            
            let msg = 'IMPORT REPORT\n\nImported: ' + peopleImported + ' people, ' + giftsImported + ' gifts\n\nDETAILS:\n' + report.join('\n');
            
            if (msg.length > 2000) {
                alert('Import complete!\n\nPeople: ' + peopleImported + '\nGifts: ' + giftsImported + '\n\nSee full report in console (F12)');
                console.log(msg);
            } else {
                alert(msg);
            }
            
            this.render();
        } catch (err) {
            alert('XLSX Import Error:\n\n' + err.message + '\n\nTroubleshooting:\n• Check Sheet names exist\n• Check column names: fullName, birthday, giftName, personName\n• Status accepts: Gifted, gifted, purchased, or not purchased\n• Try opening the file in Excel to verify format');
        }
    }
    importPerson(row) {
        const name = row.fullName || row.fullname;
        if (!name || this.people.find(p => p.fullName === name)) return;
        let bday = row.birthday || row.Birthday;
        let year = new Date().getFullYear();
        if (typeof bday === 'object' && bday.getTime) {
            year = bday.getFullYear();
            bday = String(bday.getDate()).padStart(2, '0') + '-' + String(bday.getMonth() + 1).padStart(2, '0');
        } else {
            bday = String(bday);
        }
        this.people.push({
            id: Math.max(...this.people.map(p => p.id), 0) + 1,
            fullName: name,
            birthday: bday,
            birthYear: year,
            likes: row.likes || row.Likes || '',
            dislikes: row.dislikes || row.Dislikes || '',
            notes: row.notes || row.Notes || '',
            giftHistory: [],
            includeInChristmas: false,
            messageOnly: false,
            fyiOnly: false
        });
    }
    importGift(row) {
        const name = row.giftName || row.giftname;
        const person = row.personName || row.personname;
        if (!name || !person || this.gifts.find(g => g.giftName === name && g.personName === person)) return;
        let eventId = null;
        const eventName = row.eventName || row.eventname || '';
        if (eventName) {
            let event = this.events.find(e => e.name === eventName);
            if (!event) {
                eventId = Math.max(...this.events.map(e => e.id), 0) + 1;
                this.events.push({
                    id: eventId,
                    type: 'birthday',
                    name: eventName,
                    date: '01-01-2026',
                    budget: 0,
                    notes: '',
                    personId: null,
                    personName: person,
                    year: 2026,
                    people: [{name: person, budget: 0}],
                    giftIds: []
                });
            } else {
                eventId = event.id;
            }
        }
        let status = (row.status || row.Status || 'not purchased').toLowerCase().trim();
        if (status === 'gifted' || status === 'yes') status = 'purchased';
        if (status === 'idea' || status === 'unknown' || status === 'pending') status = 'not purchased';
        if (status !== 'purchased' && status !== 'not purchased') status = 'not purchased';
        
        const giftId = Math.max(...this.gifts.map(g => g.id), 0) + 1;
        this.gifts.push({
            id: giftId,
            giftName: name,
            personName: person,
            eventId: eventId,
            status: status,
            price: parseFloat(row.price || row.Price || 0) || 0,
            url: row.url || row.URL || '',
            notes: row.notes || row.Notes || '',
            category: row.category || row.Category || 'other',
            photoUrl: '',
            purchaseYear: new Date().getFullYear()
        });
        if (eventId) {
            const event = this.events.find(e => e.id === eventId);
            if (!event.giftIds.includes(giftId)) event.giftIds.push(giftId);
        }
    }

    renderPeopleTab() {
        let html = '<div class="mb-4" style="display: flex; gap: 8px; align-items: center;"><input type="text" id="people-search-input" placeholder="Search people, events, or gifts..." oninput="window.app.handleSearchInput(event)" class="flex-1 p-2 rounded border" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><button onclick="window.app.peopleSearchText = \'\'; window.app.render()" class="px-3 py-2 rounded" style="background-color: var(--color-secondary); border: none; cursor: pointer; font-size: 16px; color: var(--color-text);" title="Clear search">✕</button></div>';
        // Set the search input value if not focused
        setTimeout(() => {
            const searchInput = document.getElementById('people-search-input');
            if (searchInput && document.activeElement !== searchInput) {
                searchInput.value = this.peopleSearchText || '';
            }
        }, 0);
        const peopleFilterOptions = [['all', 'All'], ['gift', 'Gift-tracked'], ['message', 'Message Only'], ['christmas', 'Included in Christmas'], ['fyi', 'FYI Only']];
        html += '<div class="mb-3" style="display: flex; align-items: center; gap: 8px;"><label style="color: var(--color-text-muted); font-size: 12px; white-space: nowrap;">Filter</label><select onchange="window.app.peopleTypeFilter = this.value; window.app.render()" class="flex-1 p-2 rounded border text-sm" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);">' + peopleFilterOptions.map(([val, label]) => '<option value="' + val + '"' + (this.peopleTypeFilter === val ? ' selected' : '') + '>' + label + '</option>').join('') + '</select></div>';
        const categoryOptions = [['all', 'All'], ['family', 'Family'], ['friend', 'Friend']];
        html += '<div class="mb-4" style="display: flex; gap: 8px;">' + categoryOptions.map(([val, label]) => '<button onclick="window.app.showPeopleCategory = \'' + val + '\'; window.app.render()" class="flex-1 py-2 rounded text-sm font-medium" style="background-color: ' + (this.showPeopleCategory === val ? 'var(--color-primary)' : 'var(--color-secondary)') + '; color: ' + (this.showPeopleCategory === val ? 'var(--color-primary-text)' : 'var(--color-text)') + '; border: none; cursor: pointer;">' + label + '</button>').join('') + '</div>';
        if (this.addingPerson) {
            html += '<div class="mb-4 p-4 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border);"><h3 class="font-semibold mb-3" style="color: var(--color-text);">Add Person</h3><input type="text" id="pname" placeholder="Name" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><label style="display: block; margin-bottom: 8px; color: var(--color-text); font-size: 12px;">Birthday</label><input type="date" id="pbday" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><label style="display: block; margin-bottom: 8px; color: var(--color-text); font-size: 12px;">Category</label><select id="pcat" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="friend">Friend</option><option value="family">Family</option></select><textarea id="pnotes" placeholder="Notes" class="w-full p-2 rounded border mb-2" rows="2" style="background-color: var(--color-surface); border-color: var(--color-border);"></textarea><div class="mb-2"><input type="checkbox" id="pmsg"><label for="pmsg" style="color: var(--color-text); margin-left: 8px;"> Birthday Message Only</label></div><div class="mb-2"><input type="checkbox" id="pfyi"><label for="pfyi" style="color: var(--color-text); margin-left: 8px;"> FYI Only (No Events)</label></div><div class="mb-2"><input type="checkbox" id="pxmas"><label for="pxmas" style="color: var(--color-text); margin-left: 8px;"> Include in Christmas</label></div><input type="text" id="plikes" placeholder="Likes" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><input type="text" id="pdislikes" placeholder="Dislikes" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><div id="pbday-budget-field" class="mb-2"><label style="display: block; margin-bottom: 8px; color: var(--color-text); font-size: 12px;">Birthday Budget (£)</label><input type="number" id="pbday-budget" placeholder="0" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);" step="0.01"></div><div id="pxmas-budget-field" class="mb-2"><label style="display: block; margin-bottom: 8px; color: var(--color-text); font-size: 12px;">Christmas Budget (£)</label><input type="number" id="pxmas-budget" placeholder="0" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);" step="0.01"></div><button onclick="const dateInput = document.getElementById(\'pbday\').value; if(!dateInput) { alert(\'Please select a birthday\'); return; } const [y, m, d] = dateInput.split(\'-\'); const bdayStr = d + \'-\' + m; window.app.addPerson(document.getElementById(\'pname\').value, bdayStr, y, document.getElementById(\'plikes\').value, document.getElementById(\'pdislikes\').value, document.getElementById(\'pnotes\').value, document.getElementById(\'pmsg\').checked, document.getElementById(\'pfyi\').checked, document.getElementById(\'pcat\').value, document.getElementById(\'pxmas\').checked, document.getElementById(\'pbday-budget\').value, document.getElementById(\'pxmas-budget\').value);" class="px-4 py-2 rounded text-white mr-2" style="background-color: var(--color-primary); color: var(--color-primary-text);">Add</button><button onclick="window.app.toggleAddPerson()" class="px-4 py-2 rounded border" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button></div>';
        }
        const filtered = this.filterPeopleBySearch(this.getSortedPeople(), this.peopleSearchText).filter(p => {
            // Filter by type
            if (this.peopleTypeFilter === 'gift' && (p.messageOnly || p.fyiOnly)) return false;
            if (this.peopleTypeFilter === 'message' && !p.messageOnly) return false;
            if (this.peopleTypeFilter === 'fyi' && !p.fyiOnly) return false;
            if (this.peopleTypeFilter === 'christmas' && !p.includeInChristmas) return false;
            // Filter by category - can be combined with the type filter
            const personCategory = p.category || 'friend'; // Default to friend if not set
            if (this.showPeopleCategory === 'family' && personCategory !== 'family') return false;
            if (this.showPeopleCategory === 'friend' && personCategory !== 'friend') return false;
            return true;
        });
        filtered.forEach(p => {
            const isExp = this.expandedPerson === p.id;
            const pgifts = this.getGiftsForPerson(p.fullName);
            const spent = pgifts.reduce((s, g) => s + g.price, 0);
            const nextEvent = this.getNextEvent(p);
            const daysUntil = this.getDaysUntil(p);
            html += '<div class="mb-3 swipe-item" data-swipe-item data-person-id="' + p.id + '"><div class="swipe-item-content p-4 rounded-lg border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-border);"><div class="flex-1"><button onclick="window.app.expandPerson(' + p.id + ')" class="w-full text-left"><h3 class="font-semibold" style="color: var(--color-text);">' + p.fullName + '</h3><p class="text-xs mt-1" style="color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em;">' + (p.category === 'family' ? 'Family' : 'Friend') + (p.messageOnly ? ' · Message Only' : '') + (p.fyiOnly ? ' · FYI Only' : '') + (!p.messageOnly && !p.fyiOnly ? ' · Gift-tracked' : '') + (p.includeInChristmas ? ' · Christmas' : '') + '</p><p class="text-sm mt-1" style="color: var(--color-text-muted);">' + nextEvent + ' (in ' + daysUntil + ' days)</p></button>';
            if (isExp && !this.groupEditMode) {
                const isEdit = this.editingPerson === p.id;
                if (isEdit) {
                    const currentDob = p.birthYear + '-' + p.birthday.split('-')[1] + '-' + p.birthday.split('-')[0];
                    html += '<div class="mt-3 pt-3 border-t" style="border-color: var(--color-border);"><input type="text" id="ep_name_' + p.id + '" value="' + p.fullName + '" placeholder="Name" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><label style="display: block; margin-bottom: 8px; color: var(--color-text); font-size: 12px;">Birthday</label><input type="date" id="ep_bday_' + p.id + '" value="' + currentDob + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><label style="display: block; margin-bottom: 8px; color: var(--color-text); font-size: 12px;">Category</label><select id="ep_cat_' + p.id + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="friend" ' + (p.category === 'friend' ? 'selected' : '') + '>Friend</option><option value="family" ' + (p.category === 'family' ? 'selected' : '') + '>Family</option></select><label style="display: block; margin-bottom: 8px; color: var(--color-text); font-size: 12px;">Birthday Budget (£)</label><input type="number" id="ep_bbudget_' + p.id + '" value="' + (p.birthdayBudget || '') + '" placeholder="Birthday budget" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><label style="display: block; margin-bottom: 8px; color: var(--color-text); font-size: 12px;">Christmas Budget (£)</label><input type="number" id="ep_cbudget_' + p.id + '" value="' + (p.christmasBudget || '') + '" placeholder="Christmas budget" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><input type="text" id="ep_likes_' + p.id + '" value="' + (p.likes || '') + '" placeholder="Likes" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><input type="text" id="ep_dislikes_' + p.id + '" value="' + (p.dislikes || '') + '" placeholder="Dislikes" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><textarea id="ep_notes_' + p.id + '" placeholder="Notes" class="w-full p-2 rounded border mb-2" rows="2" style="background-color: var(--color-surface); border-color: var(--color-border);">' + (p.notes || '') + '</textarea><div class="mb-2"><input type="checkbox" id="ep_msg_' + p.id + '" ' + (p.messageOnly ? 'checked' : '') + '><label for="ep_msg_' + p.id + '" style="color: var(--color-text); margin-left: 8px;"> Birthday Message Only</label></div><div class="mb-2"><input type="checkbox" id="ep_fyi_' + p.id + '" ' + (p.fyiOnly ? 'checked' : '') + '><label for="ep_fyi_' + p.id + '" style="color: var(--color-text); margin-left: 8px;"> FYI Only</label></div><div class="mb-2"><input type="checkbox" id="ep_xmas_' + p.id + '" ' + (p.includeInChristmas ? 'checked' : '') + '><label for="ep_xmas_' + p.id + '" style="color: var(--color-text); margin-left: 8px;"> Include in Christmas</label></div><button onclick="const dateInput = document.getElementById(\'ep_bday_' + p.id + '\').value; const [y, m, d] = dateInput.split(\'-\'); window.app.updatePerson(' + p.id + ', {fullName: document.getElementById(\'ep_name_' + p.id + '\').value, birthday: d + \'-\' + m, birthYear: parseInt(y), likes: document.getElementById(\'ep_likes_' + p.id + '\').value, dislikes: document.getElementById(\'ep_dislikes_' + p.id + '\').value, notes: document.getElementById(\'ep_notes_' + p.id + '\').value, category: document.getElementById(\'ep_cat_' + p.id + '\').value, birthdayBudget: document.getElementById(\'ep_bbudget_' + p.id + '\').value, christmasBudget: document.getElementById(\'ep_cbudget_' + p.id + '\').value, messageOnly: document.getElementById(\'ep_msg_' + p.id + '\').checked, fyiOnly: document.getElementById(\'ep_fyi_' + p.id + '\').checked, includeInChristmas: document.getElementById(\'ep_xmas_' + p.id + '\').checked}); window.app.editingPerson = null; window.app.render();" class="px-4 py-2 rounded text-white mr-2" style="background-color: var(--color-primary); color: var(--color-primary-text);">Save</button><button onclick="window.app.editingPerson = null; window.app.render();" class="px-4 py-2 rounded border" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button></div>';
                } else {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const [day, month] = p.birthday.split('-');
                    const formattedBday = day + ' ' + months[parseInt(month) - 1] + ' ' + p.birthYear;
                    html += '<div class="mt-3 pt-3 border-t" style="border-color: var(--color-border);"><div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs mb-1" style="color: var(--color-text-muted);">CATEGORY</p><p style="color: var(--color-text);">' + (p.category ? (p.category.charAt(0).toUpperCase() + p.category.slice(1)) : 'Friend') + '</p></div><div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs mb-1" style="color: var(--color-text-muted);">BIRTHDAY</p><p style="color: var(--color-text);">' + formattedBday + '</p></div><div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs mb-1" style="color: var(--color-text-muted);">BIRTHDAY BUDGET</p><p style="color: var(--color-text);">£' + (p.birthdayBudget || '-') + '</p></div><div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs mb-1" style="color: var(--color-text-muted);">CHRISTMAS BUDGET</p><p style="color: var(--color-text);">£' + (p.christmasBudget || '-') + '</p></div><div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs mb-1" style="color: var(--color-text-muted);">LIKES</p><p style="color: var(--color-text);">' + (p.likes || 'Not specified') + '</p></div><div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs mb-1" style="color: var(--color-text-muted);">DISLIKES</p><p style="color: var(--color-text);">' + (p.dislikes || 'Not specified') + '</p></div><div class="p-2 rounded mb-2 border" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs mb-1" style="color: var(--color-text-muted);">NOTES</p><p style="color: var(--color-text);">' + (p.notes || 'No notes') + '</p></div>';
                    html += '<div class="mb-2"><input type="checkbox" id="xmas_' + p.id + '" ' + (p.includeInChristmas ? 'checked' : '') + ' onchange="window.app.updatePerson(' + p.id + ', {includeInChristmas: this.checked})"><label for="xmas_' + p.id + '" style="color: var(--color-text);"> Include in Christmas</label></div>';
                    if (pgifts.length > 0) {
                        html += '<div class="p-2 rounded border mb-2" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs mb-2" style="color: var(--color-text-muted);">GIFTS (£' + spent.toFixed(2) + ')</p>';
                        pgifts.forEach(g => {
                            const event = this.events.find(e => e.id === g.eventId);
                            html += '<div style="color: var(--color-text);">• ' + g.giftName + ' £' + g.price.toFixed(2) + ' (' + (event ? event.name : 'No event') + ')</div>';
                        });
                        html += '</div>';
                    }
                    const preceived = this.getReceivedGiftsForPerson(p.id);
                    if (preceived.length > 0) {
                        const receivedTotal = preceived.reduce((s, g) => s + g.price, 0);
                        html += '<div class="p-2 rounded border mb-2" style="background-color: var(--color-secondary); border-color: var(--color-border);"><p class="text-xs mb-2" style="color: var(--color-text-muted);">GIFTS RECEIVED FROM THEM (£' + receivedTotal.toFixed(2) + ')</p>';
                        preceived.forEach(g => {
                            const event = this.events.find(e => e.id === g.eventId);
                            html += '<div style="color: var(--color-text);">• ' + g.giftName + ' £' + g.price.toFixed(2) + ' (' + (event ? event.name : 'No event') + ')' + (g.thankYouSent ? '<span style="color: var(--color-success);">Thanked</span>' : '<span style="color: var(--color-warning);">Not thanked</span>') + '</div>';
                        });
                        html += '</div>';
                    }
                }
            }
            html += '</div></div><div class="swipe-edit" onclick="window.app.expandPerson(' + p.id + '); window.app.editingPerson = ' + p.id + '; window.app.render();">Edit</div><div class="swipe-delete" onclick="window.app.deletePerson(' + p.id + ')">Delete</div></div>';
        });
        return html;
    }

    renderEventsTab() {
        let html = '<div class="mb-4" style="display: flex; gap: 8px; align-items: center;"><input type="text" id="events-search-input" placeholder="Search events, people, or gifts..." oninput="window.app.handleSearchInput(event)" class="flex-1 p-3 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><button onclick="window.app.eventsSearchText = \'\'; window.app.render()" class="p-3 rounded-lg" style="background-color: var(--color-secondary); border: none; cursor: pointer; font-size: 16px; color: var(--color-text);" title="Clear search">✕</button></div>';
        // Set the search input value if not focused
        setTimeout(() => {
            const searchInput = document.getElementById('events-search-input');
            if (searchInput && document.activeElement !== searchInput) {
                searchInput.value = this.eventsSearchText || '';
            }
        }, 0);
        html += '<div class="mb-4" style="display: flex; gap: 8px;"><button onclick="window.app.showEventType = \'upcoming\'; window.app.showEventCompleted = \'all\'; window.app.render()" class="flex-1 py-2 rounded text-sm font-medium" style="background-color: ' + (this.showEventType === 'upcoming' ? 'var(--color-primary)' : 'var(--color-secondary)') + '; color: ' + (this.showEventType === 'upcoming' ? 'var(--color-primary-text)' : 'var(--color-text)') + '; border: none; cursor: pointer;">Upcoming</button><button onclick="window.app.showEventType = \'historic\'; window.app.showEventCompleted = \'all\'; window.app.render()" class="flex-1 py-2 rounded text-sm font-medium" style="background-color: ' + (this.showEventType === 'historic' ? 'var(--color-primary)' : 'var(--color-secondary)') + '; color: ' + (this.showEventType === 'historic' ? 'var(--color-primary-text)' : 'var(--color-text)') + '; border: none; cursor: pointer;">Historic</button></div>';
        const eventFilterOptions = this.showEventType === 'upcoming'
            ? [['all', 'All', () => this.showEventReady === 'all' && this.showEventCompleted === 'all'], ['todo', 'To Do', () => this.showEventReady === 'todo'], ['completed', 'Completed', () => this.showEventCompleted === 'completed']]
            : [['all', 'All', () => this.showEventReady === 'all'], ['todo', 'To Do', () => this.showEventReady === 'todo']];
        html += '<div class="mb-4" style="display: flex; gap: 8px;">' + eventFilterOptions.map(([val, label, isActive]) => {
            const onclick = val === 'all' ? "window.app.showEventReady = 'all'; window.app.showEventCompleted = 'all'; window.app.render()"
                : val === 'todo' ? "window.app.showEventReady = 'todo'; window.app.showEventCompleted = 'all'; window.app.render()"
                : "window.app.showEventCompleted = 'completed'; window.app.showEventReady = 'all'; window.app.render()";
            return '<button onclick="' + onclick + '" class="flex-1 py-2 rounded text-sm font-medium" style="background-color: ' + (isActive() ? 'var(--color-primary)' : 'var(--color-secondary)') + '; color: ' + (isActive() ? 'var(--color-primary-text)' : 'var(--color-text)') + '; border: none; cursor: pointer;">' + label + '</button>';
        }).join('') + '</div>';
        if (this.addingEvent) {
            if (!this.eventType) {
                html += '<div class="mb-4 p-4 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border);"><button onclick="window.app.selectEventType(\'birthday\')" class="w-full py-2 rounded mb-2 text-white" style="background-color: var(--color-primary); color: var(--color-primary-text);">Birthday</button><button onclick="window.app.selectEventType(\'christmas\')" class="w-full py-2 rounded mb-2 text-white" style="background-color: var(--color-accent);">Christmas</button><button onclick="window.app.selectEventType(\'custom\')" class="w-full py-2 rounded mb-2 text-white" style="background-color: var(--color-primary);">Custom Event</button><button onclick="window.app.toggleAddEvent()" class="w-full py-2 rounded" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button></div>';
            } else if (this.eventType === 'birthday') {
                html += '<div class="mb-4 p-4 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border);"><select id="eperson" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option>Select Person</option>' + this.getSortedPeople().map(p => '<option value="' + p.id + '">' + p.fullName + '</option>').join('') + '</select><select id="eyear" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option>Select Year</option>' + this.getYearDropdown() + '</select><button onclick="window.app.addBirthdayEvent(document.getElementById(&#39;eperson&#39;).value, document.getElementById(&#39;eyear&#39;).value)" class="px-4 py-2 rounded text-white mr-2" style="background-color: var(--color-primary); color: var(--color-primary-text);">Add</button><button onclick="window.app.toggleAddEvent()" class="px-4 py-2 rounded" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button></div>';
            } else if (this.eventType === 'christmas') {
                html += '<div class="mb-4 p-4 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border);"><select id="cyear" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option>Select Year</option>' + this.getYearDropdown() + '</select><input type="number" id="cbudget" placeholder="Budget" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><button onclick="window.app.addChristmasEvent(document.getElementById(&#39;cyear&#39;).value, document.getElementById(&#39;cbudget&#39;).value)" class="px-4 py-2 rounded text-white mr-2" style="background-color: var(--color-accent);">Add</button><button onclick="window.app.toggleAddEvent()" class="px-4 py-2 rounded" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button></div>';
            } else if (this.eventType === 'custom') {
                html += '<div class="mb-4 p-4 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border);"><h3 class="font-semibold mb-3" style="color: var(--color-text);">Create Custom Event</h3><input type="text" id="cename" placeholder="Event name (e.g. Father\'s Day)" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><label style="display: block; margin-bottom: 8px; color: var(--color-text); font-size: 12px;">Date</label><input type="date" id="cedate" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><input type="number" id="cebudget" placeholder="Budget (optional)" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><select id="ceperson" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><option value="">Select Person (optional)</option>' + this.getSortedPeople().map(p => '<option value="' + p.id + '">' + p.fullName + '</option>').join('') + '</select><button onclick="const dateInput = document.getElementById(\'cedate\').value; if(!dateInput) { alert(\'Please select a date\'); return; } const [y, m, d] = dateInput.split(\'-\'); window.app.addCustomEvent(document.getElementById(\'cename\').value, d + \'-\' + m + \'-\' + y, document.getElementById(\'cebudget\').value, document.getElementById(\'ceperson\').value);" class="px-4 py-2 rounded text-white mr-2" style="background-color: var(--color-primary); color: var(--color-primary-text);">Add Event</button><button onclick="window.app.toggleAddEvent()" class="px-4 py-2 rounded" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button></div>';
            }
        }
        let events = this.getSortedEvents().filter(e => this.showEventType === 'upcoming' ? this.isEventUpcoming(e) : !this.isEventUpcoming(e));
        if (this.showEventType === 'historic') events.reverse();
        // Apply search filter - search by event name, person name, or gift name
        if (this.eventsSearchText) {
            const searchLower = this.eventsSearchText.toLowerCase();
            events = events.filter(e => {
                const eventMatch = e.name.toLowerCase().includes(searchLower);
                const personMatch = e.personName && e.personName.toLowerCase().includes(searchLower);
                const peopleMatch = e.people && e.people.some(p => p.name.toLowerCase().includes(searchLower));
                const giftMatch = e.giftIds && e.giftIds.some(gid => {
                    const gift = this.gifts.find(g => g.id === gid);
                    return gift && gift.giftName.toLowerCase().includes(searchLower);
                });
                return eventMatch || personMatch || peopleMatch || giftMatch;
            });
        }
        // Apply the showEventReady filter (To Do button) for both upcoming and historic events
        if (this.showEventReady === 'todo') {
            events = events.filter(e => {
                // Show events that have unassigned people OR are message-only and not yet messaged
                const hasUnassigned = this.hasUnassignedPeople(e);
                const isMessageOnlyOutstanding = e.messages !== undefined && !e.messaged;
                return hasUnassigned || isMessageOnlyOutstanding;
            });
        }
        if (this.showEventType === 'upcoming') {
            events = events.filter(e => {
                if (this.showEventCompleted === 'completed') {
                    return this.isEventCompleted(e);
                } else if (this.showEventReady === 'all') {
                    return true;
                } else if (this.showEventReady === 'ready') {
                    return this.isEventReady(e);
                }
                return true;
            });
        }
        const eventsByMonth = {};
        events.forEach(e => {
            const month = this.getMonthYear(e.date);
            if (!eventsByMonth[month]) eventsByMonth[month] = [];
            eventsByMonth[month].push(e);
        });
        let monthIdx = 0;
        Object.keys(eventsByMonth).forEach(month => {
            if (monthIdx > 0) html += '<div class="my-4" style="border-top: 1px solid var(--color-border);"></div>';
            html += '<h3 class="text-sm font-bold mb-3 mt-4" style="color: var(--color-text-muted); text-transform: uppercase;">' + month + '</h3>';
            eventsByMonth[month].forEach(e => {
                const isExp = this.expandedEvent === e.id;
                const egifts = this.getGiftsForEvent(e.id);
                const spent = egifts.reduce((s, g) => s + g.price, 0);
                const budgetStatus = this.getBudgetStatus(e);
                const person = e.personId ? this.people.find(p => p.id === e.personId) : null;
                const isMessageOnly = person && person.messageOnly;
                const isGivingHiddenBirthday = e.type === 'birthday' && this.isReceivedGiftsRelevantEvent(e);
                const allGiftsGifted = this.areAllEventGiftsGifted(e.id);
                const borderColor = 'var(--color-border)';
                const dateColor = this.getEventDateColor(e);
                html += '<div class="mb-3 swipe-item" data-swipe-item data-event-id="' + e.id + '"><div class="swipe-item-content p-4 rounded-lg border" style="background-color: var(--color-surface); border-color: ' + borderColor + '; display: block; overflow: visible;"><button onclick="window.app.expandEvent(' + e.id + ')" class="w-full text-left" style="display: block; background: none; border: none; padding: 0; margin-bottom: 12px;"><h3 class="font-semibold" style="color: var(--color-text); margin: 0;">' + e.name + ' <em style="font-style: italic; color: ' + dateColor + '; font-weight: normal;">' + this.formatDateOrdinal(e.date) + '</em></h3>' + (isMessageOnly ? '<p class="text-sm" style="color: var(--color-text-muted); margin: 4px 0 0 0;">Message Only</p>' : isGivingHiddenBirthday ? '<p class="text-sm" style="color: var(--color-text-muted); margin: 4px 0 0 0;">Received gifts tracked below</p>' : '<div style="margin: 4px 0 0 0;"><div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--color-text-muted);"><span>Budget £' + (e.totalBudget || 0).toFixed(2) + '</span><span>Spent £' + spent.toFixed(2) + '</span></div><div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px; font-size: 13px; color: var(--color-text-muted);"><span>' + egifts.length + ' gift' + (egifts.length !== 1 ? 's' : '') + '</span>' + budgetStatus + '</div></div>') + '</button>';
                if (isExp) {
                    html += '<div style="width: 100%; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-border);">';
                    if (!isMessageOnly && !isGivingHiddenBirthday) {
                        // For Christmas events, dynamically get people with includeInChristmas set
                        let eventPeople = e.people || [];
                        if (e.type === 'christmas') {
                            const christmasYear = e.year;
                            const christmasDate = new Date(christmasYear, 11, 25); // December 25
                            const dynamicPeople = this.people.filter(p => {
                                if (!p.includeInChristmas) return false;
                                // Check if their birthday has passed in the Christmas year
                                const [day, month] = p.birthday.split('-');
                                const birthdayInYear = new Date(christmasYear, parseInt(month) - 1, parseInt(day));
                                // Exclude people who were manually removed from this event
                                if (e.excludedPeople && e.excludedPeople.includes(p.fullName)) return false;
                                return birthdayInYear <= christmasDate;
                            }).map(p => ({name: p.fullName, budget: 0}));
                            
                            // Combine dynamic people with manually added people (avoid duplicates)
                            const manualPeopleNames = (e.people || []).map(p => p.name);
                            const dynamicPeopleNotInManual = dynamicPeople.filter(p => !manualPeopleNames.includes(p.name));
                            eventPeople = [...(e.people || []), ...dynamicPeopleNotInManual];
                            // Update the event's people list to include both dynamic and manual
                            e.people = eventPeople;
                        } else if (e.type === 'birthday' && e.personId) {
                            // For birthday events, dynamically get the person using personId
                            const person = this.people.find(p => p.id === e.personId);
                            eventPeople = person ? [{name: person.fullName, budget: 0}] : [];
                            // Update the event's people list to stay in sync
                            e.people = eventPeople;
                        }
                        
                        // Show people list with gift status
                        if (eventPeople.length === 0) {
                            html += '<p style="color: var(--color-text-muted); font-size: 12px; margin-top: 12px;">No people eligible for this event yet (birthdays must occur before the event date)</p>';
                        } else {
                            html += '<div style="margin-top: 12px;">';
                            eventPeople.forEach((p, idx) => {
                                const assignedGifts = e.giftAssignments ? e.giftAssignments.filter(ga => ga.personName === p.name).map(ga => this.gifts.find(g => g.id === ga.giftId)).filter(g => g) : [];
                                let giftDisplay = 'No gift';
                                if (assignedGifts.length > 0) {
                                    giftDisplay = assignedGifts.map(g => g.giftName + ' (' + g.status + ')').join(', ');
                                }
                                const availableGifts = this.gifts.filter(g => 
                                    (g.personName === p.name || !g.personName) && 
                                    g.status !== 'gifted' &&
                                    (!e.giftAssignments || !e.giftAssignments.find(ga => ga.personName === p.name && ga.giftId === g.id))
                                );
                                
                                let personBudget = p.budget || 0;
                                // If no budget in event, pull from person's default birthday budget
                                if (personBudget === 0 && e.type === 'birthday') {
                                    const person = this.people.find(pp => pp.fullName === p.name);
                                    if (person && person.birthdayBudget) {
                                        personBudget = parseFloat(person.birthdayBudget);
                                    }
                                }
                                const personSpent = this.getSpentPerPersonInEvent(e.id, p.name);
                                const personRemaining = personBudget - personSpent;
                                const personBudgetDisplay = personBudget === 0 ? 'No budget' : 'Budget £' + personBudget.toFixed(2) + ' | Spent £' + personSpent.toFixed(2) + (personRemaining < 0 ? ' | <span style="color: red;">Over £' + Math.abs(personRemaining).toFixed(2) + '</span>' : ' | Remaining £' + personRemaining.toFixed(2));
                                html += '<div style="margin-bottom: 12px;"><div class="mb-2 swipe-item" data-swipe-item style="position: relative;"><div class="swipe-item-content" style="position: relative; display: flex; align-items: flex-start; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--color-border);"><div style="flex: 1; min-width: 0;"><p style="color: var(--color-text); font-size: 14px; margin: 0; font-weight: 500;">' + p.name + '</p><p style="color: var(--color-text-muted); font-size: 11px; margin: 2px 0 0 0;">' + personBudgetDisplay + '</p>' + (assignedGifts.length > 0 ? assignedGifts.map((g, gidx) => '<div class="swipe-item" data-swipe-item style="position: relative; margin-top: 4px;"><div class="swipe-item-content" style="display: flex; justify-content: space-between; align-items: center; padding: 4px; background-color: var(--color-secondary); border-radius: 3px;"><span style="color: var(--color-text); font-size: 12px;">' + g.giftName + ' (£' + g.price.toFixed(2) + ') - ' + g.status + '</span></div><div class="swipe-edit" onclick="window.app.editGiftStatus(' + g.id + ', \'' + (p.name.replace(/'/g, "\\'")) + '\', ' + e.id + ')">Edit</div><div class="swipe-delete" onclick="window.app.removeGiftFromEvent(' + e.id + ', ' + g.id + ', \'' + (p.name.replace(/'/g, "\\'")) + '\')">Delete</div></div>').join('') : '<p style="color: var(--color-text-muted); font-size: 12px; margin: 4px 0 0 0;">No gifts assigned</p>') + '</div><button onclick="const dropdown = document.getElementById(\'gift_dropdown_' + e.id + '_' + idx + '\'); if(dropdown) { dropdown.style.display = dropdown.style.display === \'none\' ? \'block\' : \'none\'; }" style="background-color: var(--color-accent); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold; margin-left: 8px; flex-shrink: 0; margin-top: 0;">+</button></div><div class="swipe-edit" onclick="window.app.editPersonBudgetInEvent(' + e.id + ', \'' + (p.name.replace(/'/g, "\\'")) + '\')">Edit</div>' + (e.type !== 'birthday' ? '<div class="swipe-delete" onclick="window.app.removePersonFromEvent(' + e.id + ', \'' + (p.name.replace(/'/g, "\\'")) + '\')">Delete</div>' : '') + '</div></div>';
                                
                                // Hidden dropdown for selecting gift - always show it so + button works
                                const safePersonNameForGift = p.name.replace(/'/g, "\\'");
                                if (availableGifts.length > 0) {
                                    html += '<div id="gift_dropdown_' + e.id + '_' + idx + '" style="display: none; padding: 8px 0; margin-bottom: 8px;"><select id="eg_select_' + e.id + '_' + idx + '" class="w-full p-2 rounded border" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text); font-size: 12px; margin-bottom: 6px;"><option value="">Select a gift...</option>' + availableGifts.map(g => '<option value="' + g.id + '">' + g.giftName + ' (£' + g.price.toFixed(2) + ')</option>').join('') + '</select><button onclick="const sel = document.getElementById(\'eg_select_' + e.id + '_' + idx + '\'); const gid = sel.value; if(gid) { window.app.addGiftToEvent(' + e.id + ', parseInt(gid), \'' + safePersonNameForGift + '\'); document.getElementById(\'gift_dropdown_' + e.id + '_' + idx + '\').style.display = \'none\'; }" class="w-full px-3 py-2 rounded text-sm mb-2" style="background-color: var(--color-primary); color: white; font-size: 12px;">Add Gift</button><button onclick="document.getElementById(\'gift_dropdown_' + e.id + '_' + idx + '\').style.display = \'none\'; window.app.toggleAddGift(\'' + safePersonNameForGift + '\', ' + e.id + ')" class="w-full px-3 py-2 rounded text-sm" style="background-color: var(--color-accent); color: white; font-size: 12px;">+ Create new gift</button></div>';
                                } else {
                                    html += '<div id="gift_dropdown_' + e.id + '_' + idx + '" style="display: none; padding: 8px 0; margin-bottom: 8px;"><p style="color: var(--color-text-muted); font-size: 12px; margin-bottom: 6px;">No gifts available to assign</p><button onclick="document.getElementById(\'gift_dropdown_' + e.id + '_' + idx + '\').style.display = \'none\'; window.app.toggleAddGift(\'' + safePersonNameForGift + '\', ' + e.id + ')" class="w-full px-3 py-2 rounded text-sm" style="background-color: var(--color-accent); color: white; font-size: 12px;">+ Create new gift</button></div>';
                                }
                                if (this.addingGift && this.giftFormState.person === p.name && this.giftFormState.event === e.id) {
                                    html += this.renderAddGiftForm();
                                }
                            });
                            html += '</div>';
                        }
                    }
                    if (isMessageOnly) {
                        html += '<div class="flex items-center p-2 rounded mb-2" style="background-color: var(--color-secondary);"><input type="checkbox" id="msg_check_' + e.id + '" ' + (e.messaged ? 'checked' : '') + ' onchange="window.app.updateEvent(' + e.id + ', {messaged: this.checked})" style="cursor: pointer;"><label for="msg_check_' + e.id + '" style="color: var(--color-text); margin-left: 8px; cursor: pointer;"> Messaged</label></div>';
                    }

                    // Received Gifts section - only relevant for events involving "Me" or "Adam".
                    // Split into per-person subsections when both are present on the same event.
                    if (this.isReceivedGiftsRelevantEvent(e)) {
                        const relevantPeople = this.getRelevantPeopleForEvent(e);
                        html += '<div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--color-border);"><p style="color: var(--color-text); font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 8px 0;">Received Gifts</p>';
                        if (relevantPeople.length > 1) {
                            relevantPeople.forEach((personName, personIdx) => {
                                const giftsForPerson = this.getReceivedGiftsForEvent(e.id).filter(g => g.receivedByPersonName === personName);
                                const panelId = 'rgpicker_' + e.id + '_' + personIdx;
                                html += '<div style="margin-bottom: 14px;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;"><p style="color: var(--color-text-muted); font-size: 11px; font-weight: 700; letter-spacing: 0.03em; margin: 0;">FOR ' + personName.toUpperCase() + '</p><button onclick="const p = document.getElementById(\'' + panelId + '\'); if(p) { p.style.display = p.style.display === \'none\' ? \'block\' : \'none\'; }" style="background-color: var(--color-accent); color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;">+</button></div>';
                                html += this.renderReceivedGiftPicker(e.id, personName, panelId);
                                if (this.addingReceivedGift && this.receivedGiftFormState.event == e.id && this.receivedGiftFormState.receivedBy === personName) {
                                    html += this.renderReceivedGiftForm();
                                }
                                if (giftsForPerson.length === 0) {
                                    html += '<p style="color: var(--color-text-muted); font-size: 12px;">No received gifts logged yet</p>';
                                } else {
                                    giftsForPerson.forEach(rg => { html += this.renderReceivedGiftItem(rg); });
                                }
                                html += '</div>';
                            });
                            // Catch any legacy/unassigned gifts on this event so nothing is silently hidden
                            const unassigned = this.getReceivedGiftsForEvent(e.id).filter(g => !relevantPeople.includes(g.receivedByPersonName));
                            if (unassigned.length > 0) {
                                html += '<div style="margin-bottom: 14px;"><p style="color: var(--color-text-muted); font-size: 11px; font-weight: 700; letter-spacing: 0.03em; margin: 0 0 6px 0;">UNASSIGNED</p>';
                                unassigned.forEach(rg => { html += this.renderReceivedGiftItem(rg); });
                                html += '</div>';
                            }
                        } else {
                            const singlePerson = relevantPeople[0];
                            const panelId = 'rgpicker_' + e.id + '_single';
                            html += '<div style="display: flex; justify-content: flex-end; margin-bottom: 8px;"><button onclick="const p = document.getElementById(\'' + panelId + '\'); if(p) { p.style.display = p.style.display === \'none\' ? \'block\' : \'none\'; }" style="background-color: var(--color-accent); color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">+</button></div>';
                            html += this.renderReceivedGiftPicker(e.id, singlePerson, panelId);
                            if (this.addingReceivedGift && this.receivedGiftFormState.event == e.id) {
                                html += this.renderReceivedGiftForm();
                            }
                            const eventReceivedGifts = this.getReceivedGiftsForEvent(e.id);
                            if (eventReceivedGifts.length === 0) {
                                html += '<p style="color: var(--color-text-muted); font-size: 12px;">No received gifts logged yet</p>';
                            } else {
                                eventReceivedGifts.forEach(rg => { html += this.renderReceivedGiftItem(rg); });
                            }
                        }
                        html += '</div>';
                    }
                    
                    // Show edit button or edit form
                    const isEditing = this.editingEvent === e.id;
                    if (!isEditing) {
                        html += '<button onclick="window.app.toggleEditEvent(' + e.id + ')" class="w-full py-2 rounded mt-3" style="background-color: var(--color-secondary); color: var(--color-text);">Edit Event</button>';
                    } else {
                        const giftablePeople = this.getGiftablePeople();
                        html += '<div class="mt-3 pt-3 border-t" style="border-color: var(--color-border);"><input type="text" id="ee_name_' + e.id + '" value="' + e.name + '" placeholder="Event name" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);"><input type="date" id="ee_date_' + e.id + '" value="' + (e.date.split('-').reverse().join('-')) + '" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);">' + (isGivingHiddenBirthday ? '' : '<label style="display: block; margin-bottom: 8px; color: var(--color-text); font-size: 12px;">Event Total Budget (£)</label><input type="number" id="ee_budget_' + e.id + '" value="' + (e.totalBudget || 0) + '" placeholder="Total budget" class="w-full p-2 rounded border mb-2" style="background-color: var(--color-surface); border-color: var(--color-border);">') + '<textarea id="ee_notes_' + e.id + '" placeholder="Notes" class="w-full p-2 rounded border mb-2" rows="2" style="background-color: var(--color-surface); border-color: var(--color-border);">' + (e.notes || '') + '</textarea>' + (isGivingHiddenBirthday ? '' : '<div style="margin-bottom: 12px; padding-top: 12px; border-top: 1px solid var(--color-border);"><p style="color: var(--color-text); font-size: 12px; font-weight: 500; margin: 0 0 8px 0;">Add People</p><div style="display: flex; gap: 6px;"><select id="ee_addperson_' + e.id + '" class="flex-1 p-2 rounded border" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text); font-size: 12px;"><option value="">Select person...</option>' + giftablePeople.map(p => '<option value="' + p.fullName + '">' + p.fullName + '</option>').join('') + '</select><button onclick="const sel = document.getElementById(\'ee_addperson_' + e.id + '\'); if(sel.value) { window.app.addPersonToEvent(' + e.id + ', sel.value); sel.value = \'\'; }" class="px-3 py-2 rounded text-sm" style="background-color: var(--color-accent); color: white; font-size: 12px; white-space: nowrap;">+ Add</button></div></div>') + '<button onclick="const dateInput = document.getElementById(\'ee_date_' + e.id + '\').value; const [y, m, d] = dateInput.split(\'-\'); const budgetEl = document.getElementById(\'ee_budget_' + e.id + '\'); const newBudget = budgetEl ? (parseFloat(budgetEl.value) || 0) : (window.app.events.find(ev => ev.id === ' + e.id + ').totalBudget || 0); const totalPersonBudgets = (window.app.events.find(ev => ev.id === ' + e.id + ').people || []).reduce((s, p) => s + (p.budget || 0), 0); if(newBudget < totalPersonBudgets) { alert(\'Warning: Event budget (£\' + newBudget.toFixed(2) + \') is less than sum of person budgets (£\' + totalPersonBudgets.toFixed(2) + \'). You are underfunded.\'); } window.app.updateEvent(' + e.id + ', {name: document.getElementById(\'ee_name_' + e.id + '\').value, date: d + \'-\' + m + \'-\' + y, totalBudget: newBudget, notes: document.getElementById(\'ee_notes_' + e.id + '\').value}); window.app.editingEvent = null;" class="px-4 py-2 rounded text-white mr-2" style="background-color: var(--color-primary); color: var(--color-primary-text);">Save</button><button onclick="window.app.toggleEditEvent(' + e.id + ')" class="px-4 py-2 rounded border" style="background-color: var(--color-secondary); color: var(--color-text);">Cancel</button></div>';
                    }
                    
                    html += '</div>';
                }
                html += '<div class="swipe-edit" onclick="window.app.toggleEditEvent(' + e.id + ')">Edit</div><div class="swipe-delete" onclick="window.app.deleteEvent(' + e.id + ')">Delete</div></div></div>';
            });
            monthIdx++;
        });
        return html;
    }

    renderGiftsTab() {
        let html = '<div class="mb-4" style="display: flex; gap: 8px; align-items: center;"><input type="text" id="gifts-search-input" placeholder="Search gifts, people, or events..." oninput="window.app.handleSearchInput(event)" class="flex-1 p-2 rounded border" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><button onclick="window.app.giftsSearchText = \'\'; window.app.render()" class="px-3 py-2 rounded" style="background-color: var(--color-secondary); border: none; cursor: pointer; font-size: 16px; color: var(--color-text);" title="Clear search">✕</button></div>';
        // Set the search input value if not focused
        setTimeout(() => {
            const searchInput = document.getElementById('gifts-search-input');
            if (searchInput && document.activeElement !== searchInput) {
                searchInput.value = this.giftsSearchText || '';
            }
        }, 0);
        html += '<div class="mb-4" style="display: flex; gap: 8px;"><button onclick="window.app.showGiftsView = \'given\'; window.app.render()" class="flex-1 py-2 rounded text-sm font-medium" style="background-color: ' + (this.showGiftsView === 'given' ? 'var(--color-primary)' : 'var(--color-secondary)') + '; color: ' + (this.showGiftsView === 'given' ? 'var(--color-primary-text)' : 'var(--color-text)') + '; border: none; cursor: pointer;">Given</button><button onclick="window.app.showGiftsView = \'received\'; window.app.render()" class="flex-1 py-2 rounded text-sm font-medium" style="background-color: ' + (this.showGiftsView === 'received' ? 'var(--color-primary)' : 'var(--color-secondary)') + '; color: ' + (this.showGiftsView === 'received' ? 'var(--color-primary-text)' : 'var(--color-text)') + '; border: none; cursor: pointer;">Received</button></div>';
        const groupByOptionsGiven = [['none', 'No grouping'], ['event', 'Event'], ['person', 'Person'], ['status', 'Status']];
        const groupByOptionsReceived = [['none', 'No grouping'], ['event', 'Event'], ['receivedBy', 'Received By'], ['from', 'From (Giver)'], ['thanked', 'Thank You Status']];
        const activeGroupOptions = this.showGiftsView === 'given' ? groupByOptionsGiven : groupByOptionsReceived;
        const activeGroupBy = this.showGiftsView === 'given' ? this.givenGroupBy : this.receivedGroupBy;
        const groupByStateKey = this.showGiftsView === 'given' ? 'givenGroupBy' : 'receivedGroupBy';
        html += '<div class="mb-4" style="display: flex; align-items: center; gap: 8px;"><label style="color: var(--color-text-muted); font-size: 12px; white-space: nowrap;">Group by</label><select onchange="window.app.' + groupByStateKey + ' = this.value; window.app.render()" class="flex-1 p-2 rounded border text-sm" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);">' + activeGroupOptions.map(([val, label]) => '<option value="' + val + '"' + (activeGroupBy === val ? ' selected' : '') + '>' + label + '</option>').join('') + '</select></div>';
        if (this.showGiftsView === 'received') {
            const tyOptions = [['all', 'All'], ['no', 'Outstanding'], ['yes', 'Thanked']];
            html += '<div class="mb-4" style="display: flex; gap: 8px;">' + tyOptions.map(([val, label]) => '<button onclick="window.app.receivedThankYouFilter = \'' + val + '\'; window.app.render()" class="flex-1 py-2 rounded text-sm font-medium" style="background-color: ' + (this.receivedThankYouFilter === val ? 'var(--color-primary)' : 'var(--color-secondary)') + '; color: ' + (this.receivedThankYouFilter === val ? 'var(--color-primary-text)' : 'var(--color-text)') + '; border: none; cursor: pointer;">' + label + '</button>').join('') + '</div>';
        }
        if (this.showGiftsView === 'given') {
        if (this.addingGift) {
            html += this.renderAddGiftForm();
        }
        const filtered = this.filterGiftsBySearch(this.gifts.filter(g => this.showGiftStatus === 'all' ? true : g.status === this.showGiftStatus), this.giftsSearchText);
        if (filtered.length === 0) {
            html += '<p style="color: var(--color-text-muted); font-size: 14px; text-align: center; padding: 20px 0;">No gifts found</p>';
        } else if (this.givenGroupBy === 'none') {
            filtered.forEach(g => { html += this.renderGivenGiftItem(g); });
        } else {
            html += this.renderGroupedGivenGifts(filtered, this.givenGroupBy);
        }
        } else {
            // Received gifts view
            if (this.addingReceivedGift) {
                html += this.renderReceivedGiftForm();
            }
            let filteredReceived = this.filterReceivedGiftsBySearch(this.receivedGifts, this.giftsSearchText);
            if (this.receivedThankYouFilter === 'yes') filteredReceived = filteredReceived.filter(g => g.thankYouSent);
            else if (this.receivedThankYouFilter === 'no') filteredReceived = filteredReceived.filter(g => !g.thankYouSent);
            if (filteredReceived.length === 0) {
                html += '<p style="color: var(--color-text-muted); font-size: 14px; text-align: center; padding: 20px 0;">No received gifts logged yet</p>';
            } else if (this.receivedGroupBy === 'none') {
                filteredReceived.forEach(g => { html += this.renderReceivedGiftItem(g); });
            } else {
                html += this.renderGroupedReceivedGifts(filteredReceived, this.receivedGroupBy);
            }
        }
        return html;
    }

    getPersonStats() {
        const personStats = {};
        
        // Initialize stats for each person with events
        this.events.forEach(event => {
            if (event.type === 'birthday' && event.personName) {
                if (!personStats[event.personName]) {
                    personStats[event.personName] = {
                        name: event.personName,
                        birthdaySpends: [],
                        christmasSpends: [],
                    };
                }
            } else if (event.type === 'christmas' && event.people) {
                event.people.forEach(person => {
                    if (!personStats[person.name]) {
                        personStats[person.name] = {
                            name: person.name,
                            birthdaySpends: [],
                            christmasSpends: [],
                        };
                    }
                });
            }
        });
        
        // Collect spending data
        this.gifts.forEach(gift => {
            if (gift.personName && gift.eventId) {
                const event = this.events.find(e => e.id === gift.eventId);
                if (event && personStats[gift.personName]) {
                    if (event.type === 'birthday') {
                        personStats[gift.personName].birthdaySpends.push(gift.price);
                    } else if (event.type === 'christmas') {
                        personStats[gift.personName].christmasSpends.push(gift.price);
                    }
                }
            }
        });
        
        // Calculate averages and filter out people with no events
        const stats = Object.values(personStats).filter(p => p.birthdaySpends.length > 0 || p.christmasSpends.length > 0).map(p => ({
            name: p.name,
            avgBirthday: p.birthdaySpends.length > 0 ? (p.birthdaySpends.reduce((a, b) => a + b, 0) / p.birthdaySpends.length).toFixed(2) : 'N/A',
            avgChristmas: p.christmasSpends.length > 0 ? (p.christmasSpends.reduce((a, b) => a + b, 0) / p.christmasSpends.length).toFixed(2) : 'N/A',
            birthdayCount: p.birthdaySpends.length,
            christmasCount: p.christmasSpends.length,
        }));
        
        return stats.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderReportingTab() {
        const outstanding = this.getOutstandingCounts();
        const totalSpent = this.getTotalSpent();
        const avgBday = this.getAverageBirthdaySpend();
        const avgXmas = this.getAverageChristmasSpend();
        const topGiftees = this.getTopGiftees();
        const { breakdown, total, giftedCount } = this.getGiftStatusBreakdown();
        const totalReceived = this.receivedGifts.reduce((s, g) => s + g.price, 0);
        const thankedCount = this.receivedGifts.filter(g => g.thankYouSent).length;
        const topGivers = this.getTopGivers();

        let html = '';

        // ---- Needs Attention: actionable, tappable straight into the relevant filtered view ----
        html += '<p class="text-xs font-bold mb-2" style="color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Needs Attention</p>';
        html += '<div class="mb-4" style="display: flex; flex-direction: column; gap: 8px;">';
        html += '<div onclick="window.app.currentTab = \'gifts\'; window.app.showGiftsView = \'given\'; window.app.givenGroupBy = \'status\'; window.app.render()" class="p-3 rounded-lg border cursor-pointer" style="background-color: var(--color-surface); border-color: var(--color-border); display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--color-text); font-size: 14px;">Gifts still to buy or plan</span><span class="font-bold" style="color: ' + (outstanding.toBuy > 0 ? 'var(--color-warning)' : 'var(--color-success)') + '; font-size: 18px;">' + outstanding.toBuy + '</span></div>';
        html += '<div onclick="window.app.currentTab = \'gifts\'; window.app.showGiftsView = \'received\'; window.app.receivedThankYouFilter = \'no\'; window.app.render()" class="p-3 rounded-lg border cursor-pointer" style="background-color: var(--color-surface); border-color: var(--color-border); display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--color-text); font-size: 14px;">Thank-yous outstanding</span><span class="font-bold" style="color: ' + (outstanding.thankYous > 0 ? 'var(--color-warning)' : 'var(--color-success)') + '; font-size: 18px;">' + outstanding.thankYous + '</span></div>';
        html += '<div onclick="window.app.currentTab = \'events\'; window.app.showEventType = \'upcoming\'; window.app.showEventReady = \'todo\'; window.app.showEventCompleted = \'all\'; window.app.render()" class="p-3 rounded-lg border cursor-pointer" style="background-color: var(--color-surface); border-color: var(--color-border); display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--color-text); font-size: 14px;">Upcoming events needing gifts assigned</span><span class="font-bold" style="color: ' + (outstanding.eventsNeedingGifts > 0 ? 'var(--color-warning)' : 'var(--color-success)') + '; font-size: 18px;">' + outstanding.eventsNeedingGifts + '</span></div>';
        html += '</div>';

        // ---- Giving ----
        html += '<p class="text-xs font-bold mb-2" style="color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Giving</p>';
        html += '<div class="grid grid-cols-3 gap-2 mb-3">';
        html += '<div class="p-3 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border);"><p class="text-xs font-bold mb-1" style="color: var(--color-accent);">Total Spent</p><p class="text-lg font-bold" style="color: var(--color-text);">£' + totalSpent.toFixed(2) + '</p></div>';
        html += '<div onclick="window.app.showEventTypeSpendModal(\'birthday\')" class="p-3 rounded-lg border cursor-pointer" style="background-color: var(--color-surface); border-color: var(--color-border);"><p class="text-xs font-bold mb-1" style="color: var(--color-primary);">Avg Birthday</p><p class="text-lg font-bold" style="color: var(--color-text);">£' + avgBday + '</p></div>';
        html += '<div onclick="window.app.showEventTypeSpendModal(\'christmas\')" class="p-3 rounded-lg border cursor-pointer" style="background-color: var(--color-surface); border-color: var(--color-border);"><p class="text-xs font-bold mb-1" style="color: var(--color-success);">Avg Christmas</p><p class="text-lg font-bold" style="color: var(--color-text);">£' + avgXmas + '</p></div>';
        html += '</div>';

        if (total > 0) {
            html += '<div class="p-4 rounded-lg border mb-4" style="background-color: var(--color-surface); border-color: var(--color-border);"><p class="text-xs font-bold mb-3" style="color: var(--color-text-muted); text-transform: uppercase;">Gift Status</p>';
            breakdown.forEach(b => {
                if (b.count === 0) return;
                html += '<div class="flex items-center justify-between mb-1"><span style="color: var(--color-text); font-size: 13px;">' + b.label + '</span><span style="color: var(--color-text-muted); font-size: 13px;">' + b.count + '</span></div>';
            });
            html += '<div class="w-full rounded-full h-2 mt-2" style="background-color: var(--color-border);"><div class="h-2 rounded-full" style="width: ' + (total > 0 ? (giftedCount / total * 100) : 0) + '%; background-color: var(--color-success);"></div></div><p class="text-xs mt-1" style="color: var(--color-text-muted);">' + giftedCount + ' of ' + total + ' fully gifted</p></div>';
        }

        if (topGiftees.length > 0) {
            html += '<div class="p-4 rounded-lg border mb-4" style="background-color: var(--color-surface); border-color: var(--color-border);"><p class="text-xs font-bold mb-3" style="color: var(--color-text-muted); text-transform: uppercase;">Top Recipients</p>';
            topGiftees.forEach((giftee, idx) => {
                html += '<div onclick="window.app.showRecipientHistoryModal(\'' + giftee.name.replace(/'/g, "\\'") + '\')" class="flex items-center justify-between pb-2 cursor-pointer' + (idx < topGiftees.length - 1 ? ' border-b' : '') + '" style="' + (idx < topGiftees.length - 1 ? 'border-color: var(--color-border);' : '') + '"><div><p class="text-sm font-medium" style="color: var(--color-text);">' + (idx + 1) + '. ' + giftee.name + '</p><p class="text-xs" style="color: var(--color-text-muted);">' + giftee.count + ' gift' + (giftee.count > 1 ? 's' : '') + ' • tap for history</p></div><p class="text-sm font-bold" style="color: var(--color-accent);">£' + giftee.spent.toFixed(2) + '</p></div>';
            });
            html += '</div>';
        }

        // ---- Receiving ----
        if (this.receivedGifts.length > 0 || this.getMeAdamPeopleNames().length > 0) {
            html += '<p class="text-xs font-bold mb-2" style="color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Receiving</p>';
            html += '<div class="grid grid-cols-2 gap-2 mb-3">';
            html += '<div class="p-3 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border);"><p class="text-xs font-bold mb-1" style="color: var(--color-accent);">Total Received</p><p class="text-lg font-bold" style="color: var(--color-text);">£' + totalReceived.toFixed(2) + '</p></div>';
            html += '<div class="p-3 rounded-lg border" style="background-color: var(--color-surface); border-color: var(--color-border);"><p class="text-xs font-bold mb-1" style="color: var(--color-text-muted);">Thank Yous Sent</p><p class="text-lg font-bold" style="color: var(--color-text);">' + thankedCount + ' / ' + this.receivedGifts.length + '</p></div>';
            html += '</div>';

            if (topGivers.length > 0) {
                html += '<div class="p-4 rounded-lg border mb-4" style="background-color: var(--color-surface); border-color: var(--color-border);"><p class="text-xs font-bold mb-3" style="color: var(--color-text-muted); text-transform: uppercase;">Top Givers</p>';
                topGivers.forEach((giver, idx) => {
                    html += '<div onclick="window.app.showGiverHistoryModal(\'' + giver.giverType + '\', ' + giver.giverId + ')" class="flex items-center justify-between pb-2 cursor-pointer' + (idx < topGivers.length - 1 ? ' border-b' : '') + '" style="' + (idx < topGivers.length - 1 ? 'border-color: var(--color-border);' : '') + '"><div><p class="text-sm font-medium" style="color: var(--color-text);">' + (idx + 1) + '. ' + giver.name + '</p><p class="text-xs" style="color: var(--color-text-muted);">' + giver.count + ' gift' + (giver.count > 1 ? 's' : '') + ' • tap for history</p></div><p class="text-sm font-bold" style="color: var(--color-accent);">£' + giver.spent.toFixed(2) + '</p></div>';
                });
                html += '</div>';
            }
        }

        html += '<div onclick="window.app.showPersonStatsModal()" class="p-4 rounded-lg border cursor-pointer" style="background-color: var(--color-surface); border-color: var(--color-border); text-align: center;"><p class="text-sm font-bold" style="color: var(--color-primary);">Person-Level Stats</p><p class="text-xs" style="color: var(--color-text-muted);">Tap to view average spending by person</p></div>';

        return html;
    }

    showPersonStatsModal(sortBy = 'avgBirthday', sortOrder = 'desc') {
        const personStats = this.getPersonStats();
        
        // Sort the stats based on sortBy and sortOrder
        const sortedStats = [...personStats].sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            if (aVal === 'N/A') aVal = -Infinity;
            else aVal = parseFloat(aVal);
            
            if (bVal === 'N/A') bVal = -Infinity;
            else bVal = parseFloat(bVal);
            
            if (sortOrder === 'desc') {
                return bVal - aVal;
            } else {
                return aVal - bVal;
            }
        });
        
        let modalContent = '<div style="padding: 20px;"><h2 style="margin-bottom: 20px; color: #2D3436;">Person-Level Spending Stats</h2>';
        
        if (sortedStats.length === 0) {
            modalContent += '<p style="color: #636E72;">No person data available yet.</p>';
        } else {
            modalContent += '<table style="width: 100%; border-collapse: collapse; color: #2D3436;"><tr style="background-color: #F5F6FA; border-bottom: 2px solid #DFE6E9;"><th style="padding: 12px; text-align: left; font-weight: bold; cursor: pointer;" onclick="window.app.showPersonStatsModal(\'name\', ' + (sortBy === 'name' && sortOrder === 'asc' ? '\'desc\'' : '\'asc\'') + ')">Person ' + (sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '') + '</th><th style="padding: 12px; text-align: center; font-weight: bold; cursor: pointer;" onclick="window.app.showPersonStatsModal(\'avgBirthday\', ' + (sortBy === 'avgBirthday' && sortOrder === 'desc' ? '\'asc\'' : '\'desc\'') + ')">Avg Birthday ' + (sortBy === 'avgBirthday' ? (sortOrder === 'desc' ? '▼' : '▲') : '') + '</th><th style="padding: 12px; text-align: center; font-weight: bold; cursor: pointer;" onclick="window.app.showPersonStatsModal(\'avgChristmas\', ' + (sortBy === 'avgChristmas' && sortOrder === 'desc' ? '\'asc\'' : '\'desc\'') + ')">Avg Christmas ' + (sortBy === 'avgChristmas' ? (sortOrder === 'desc' ? '▼' : '▲') : '') + '</th></tr>';
            
            sortedStats.forEach(person => {
                modalContent += '<tr style="border-bottom: 1px solid #DFE6E9;"><td style="padding: 12px;">' + person.name + '</td><td style="padding: 12px; text-align: center;">' + (person.avgBirthday === 'N/A' ? 'N/A' : '£' + person.avgBirthday) + '</td><td style="padding: 12px; text-align: center;">' + (person.avgChristmas === 'N/A' ? 'N/A' : '£' + person.avgChristmas) + '</td></tr>';
            });
            
            modalContent += '</table>';
        }
        
        modalContent += '<div style="margin-top: 20px; text-align: right;"><button onclick="document.querySelector(\'[data-modal-person-stats]\').remove();" style="padding: 10px 20px; border: none; border-radius: 6px; background-color: #FF6B9D; color: white; cursor: pointer; font-weight: 500;">Close</button></div></div>';
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
        
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        dialog.innerHTML = modalContent;
        
        modal.setAttribute('data-modal-person-stats', 'true');
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    renderSettings() {
        let html = '<div class="max-w-4xl mx-auto px-4 py-4 border-t" style="border-color: var(--color-border); background-color: var(--color-surface);"><h3 class="font-semibold mb-4" style="color: var(--color-text);">Settings</h3><div class="space-y-3"><label class="w-full py-3 px-4 rounded-lg border text-left cursor-pointer" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text); display: block;"><input type="file" accept=".csv,.xlsx" onchange="window.app.importData(this.files[0])" style="display: none;"><span style="display: inline-flex; align-items: center; gap: 6px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>Import Data</span><p class="text-xs mt-1" style="color: var(--color-text-muted);">Upload CSV or XLSX file</p></label><button onclick="window.app.showPasteModal(); return false;" class="w-full py-3 px-4 rounded-lg border text-left" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text); text-align: left; cursor: pointer;"><span style="display: inline-flex; align-items: center; gap: 6px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path></svg>Paste Data</span><p class="text-xs mt-1" style="color: var(--color-text-muted);">Copy from Excel and paste here</p></button><button onclick="const y = prompt(\'Enter year:\'); if(y) window.app.createAllEventsForYear(y)" class="w-full py-3 px-4 rounded-lg border text-left" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><span style="display: inline-flex; align-items: center; gap: 6px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Auto-Generate Events</span><p class="text-xs mt-1" style="color: var(--color-text-muted);">Create all birthday and Christmas events for a year</p></button><button onclick="window.app.exportToCSV()" class="w-full py-3 px-4 rounded-lg border text-left" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"><span style="display: inline-flex; align-items: center; gap: 6px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Export Data as CSV</span><p class="text-xs mt-1" style="color: var(--color-text-muted);">Download all your data</p></button></div><h3 class="font-semibold mt-6 mb-4" style="color: var(--color-text);">Shop Database</h3><div style="background-color: var(--color-secondary); border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid var(--color-border);">';
        if (this.shops.length === 0) {
            html += '<p style="color: var(--color-text-muted); font-size: 14px;">No shops added yet. Add your first shop when creating a gift.</p>';
        } else {
            html += '<div style="display: grid; gap: 8px;">';
            this.shops.forEach((shop, idx) => {
                html += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background-color: var(--color-surface); border-radius: 4px; border: 1px solid var(--color-border);"><span style="color: var(--color-text);">' + shop + '</span><button onclick="window.app.deleteShop(' + idx + ')" style="background-color: transparent; color: var(--color-error); border: 1px solid var(--color-error); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">Delete</button></div>';
            });
            html += '</div>';
        }
        html += '</div><h3 class="font-semibold mt-6 mb-4" style="color: var(--color-text);">Other Givers</h3><p style="color: var(--color-text-muted); font-size: 12px; margin-bottom: 8px;">People who\'ve given you gifts but aren\'t in your People list.</p><div style="background-color: var(--color-secondary); border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid var(--color-border);">';
        if (this.otherGivers.length === 0) {
            html += '<p style="color: var(--color-text-muted); font-size: 14px;">No other givers added yet. Add one when logging a received gift.</p>';
        } else {
            html += '<div style="display: grid; gap: 8px;">';
            [...this.otherGivers].sort((a, b) => a.name.localeCompare(b.name)).forEach(giver => {
                const giftCount = this.receivedGifts.filter(rg => rg.giverType === 'other' && rg.giverId === giver.id).length;
                html += '<div style="padding: 8px; background-color: var(--color-surface); border-radius: 4px; border: 1px solid var(--color-border);"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;"><span style="color: var(--color-text);">' + giver.name + (giftCount > 0 ? ' <span style="color: var(--color-text-muted); font-size: 11px;">(' + giftCount + ' gift' + (giftCount > 1 ? 's' : '') + ')</span>' : '') + '</span></div><div style="display: flex; gap: 6px; flex-wrap: wrap;"><button onclick="window.app.renameOtherGiver(' + giver.id + ')" style="background-color: transparent; color: var(--color-text); border: 1px solid var(--color-border); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500;">Rename</button><button onclick="window.app.mergeOtherGiverPrompt(' + giver.id + ')" style="background-color: transparent; color: var(--color-text); border: 1px solid var(--color-border); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500;">Merge</button><button onclick="window.app.convertGiverToPerson(' + giver.id + ')" style="background-color: transparent; color: var(--color-text); border: 1px solid var(--color-border); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500;">Convert to Person</button><button onclick="window.app.deleteOtherGiver(' + giver.id + ')" style="background-color: transparent; color: var(--color-error); border: 1px solid var(--color-error); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500;">Delete</button></div></div>';
            });
            html += '</div>';
        }
        html += '</div><button onclick="window.app.toggleSettings()" class="w-full mt-3 py-2 rounded-lg" style="background-color: var(--color-secondary); color: var(--color-text);">Close Settings</button></div>';
        return html;
    }

    handleSearchInput(event) {
        if (this.currentTab === 'events') {
            this.eventsSearchText = event.target.value;
        } else if (this.currentTab === 'people') {
            this.peopleSearchText = event.target.value;
        } else if (this.currentTab === 'gifts') {
            this.giftsSearchText = event.target.value;
        }
        // Use a light render that preserves input focus
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
            this.renderWithoutInput();
        }, 100);
    }
    
    renderWithoutInput() {
        // Store the currently focused element
        const focusedElement = document.activeElement;
        const focusedId = focusedElement?.id;
        const focusedValue = focusedElement?.value;
        
        // Do the normal render
        this.render();
        
        // Restore focus if it was an input
        if (focusedId) {
            const restored = document.getElementById(focusedId);
            if (restored) {
                restored.focus();
                if (focusedValue !== undefined) {
                    restored.value = focusedValue;
                }
            }
        }
    }

    render() {
        let content = '';
        if (this.currentTab === 'events') content = this.renderEventsTab();
        else if (this.currentTab === 'people') content = this.renderPeopleTab();
        else if (this.currentTab === 'gifts') content = this.renderGiftsTab();
        else if (this.currentTab === 'reporting') content = this.renderReportingTab();

        const html = '<div style="background-color: var(--color-bg); min-height: 100vh;"><div class="sticky top-0 z-50" style="background-color: var(--color-surface); border-bottom: 1px solid var(--color-border);"><div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between"><div class="flex items-center gap-2"><h1 class="text-2xl font-bold" style="color: var(--color-text);">Gift Tracker</h1></div><div class="flex gap-2"><button onclick="window.app.toggleSettings()" class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: var(--color-secondary); color: var(--color-text);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button><button onclick="' + (this.currentTab === 'events' ? 'window.app.toggleAddEvent()' : (this.currentTab === 'people' ? 'window.app.toggleAddPerson()' : (this.currentTab === 'gifts' ? (this.showGiftsView === 'given' ? 'window.app.toggleAddGift()' : 'window.app.toggleAddReceivedGift()') : null))) + '" class="w-10 h-10 rounded-full flex items-center justify-center text-white" style="background-color: var(--color-primary); color: var(--color-primary-text);">+</button></div></div>' + (this.showSettings ? this.renderSettings() : '') + '<div class="max-w-4xl mx-auto px-4 flex gap-2 border-t overflow-x-auto" style="border-color: var(--color-border);"><button onclick="window.app.currentTab = \'events\'; window.app.render()" class="py-3 px-4 font-medium text-sm whitespace-nowrap" style="color: ' + (this.currentTab === 'events' ? 'var(--color-primary)' : 'var(--color-text-muted)') + '; border-bottom: 2px solid ' + (this.currentTab === 'events' ? 'var(--color-primary)' : 'transparent') + ';">Events</button><button onclick="window.app.currentTab = \'people\'; window.app.render()" class="py-3 px-4 font-medium text-sm whitespace-nowrap" style="color: ' + (this.currentTab === 'people' ? 'var(--color-primary)' : 'var(--color-text-muted)') + '; border-bottom: 2px solid ' + (this.currentTab === 'people' ? 'var(--color-primary)' : 'transparent') + ';">People</button><button onclick="window.app.currentTab = \'gifts\'; window.app.render()" class="py-3 px-4 font-medium text-sm whitespace-nowrap" style="color: ' + (this.currentTab === 'gifts' ? 'var(--color-primary)' : 'var(--color-text-muted)') + '; border-bottom: 2px solid ' + (this.currentTab === 'gifts' ? 'var(--color-primary)' : 'transparent') + ';">Gifts</button><button onclick="window.app.currentTab = \'reporting\'; window.app.render()" class="py-3 px-4 font-medium text-sm whitespace-nowrap" style="color: ' + (this.currentTab === 'reporting' ? 'var(--color-primary)' : 'var(--color-text-muted)') + '; border-bottom: 2px solid ' + (this.currentTab === 'reporting' ? 'var(--color-primary)' : 'transparent') + ';">Reporting</button></div></div><div class="max-w-4xl mx-auto px-4 py-6 pb-20">' + content + '</div></div>';

        document.getElementById('app').innerHTML = html;
        this.initSwipeHandlers();
    }
}

window.app = new GiftTracker();
    </script>
</body>
</html>
