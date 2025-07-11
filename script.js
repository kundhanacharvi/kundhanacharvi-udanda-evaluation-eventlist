const API_URL = 'http://localhost:3000/events';
let events = [];
let currentEditingId = null;
let isAddingEvent = false;

// Initializing the application
document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    setupEventListeners();
});

// Setup event listeners for dynamic content
function setupEventListeners() {
    // Event delegation for action buttons
    document.getElementById('eventTableBody').addEventListener('click', function(e) {
        const button = e.target.closest('.action-btn');
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        console.log('Button clicked:', action, 'ID:', id); // Debug log

        switch(action) {
            case 'edit':
                editEvent(id);
                break;
            case 'delete':
                deleteEvent(id);
                break;
            case 'save':
                saveEdit(id);
                break;
            case 'cancel':
                cancelEdit();
                break;
        }
    });
}

// Loading events from the server
async function loadEvents() {
    try {
        showLoading();
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        events = await response.json();
        renderEvents();
    } catch (error) {
        console.error('Error loading events:', error);
        hideLoading();
        showNoEvents();
    }
}

// Show loading message
function showLoading() {
    document.getElementById('loadingMessage').style.display = 'block';
    document.getElementById('eventTable').style.display = 'none';
    document.getElementById('noEvents').style.display = 'none';
}

// Hide loading message
function hideLoading() {
    document.getElementById('loadingMessage').style.display = 'none';
}

// Show no events message
function showNoEvents() {
    document.getElementById('noEvents').style.display = 'block';
    document.getElementById('eventTable').style.display = 'none';
}

// Render events in the table
function renderEvents() {
    hideLoading();
    const tbody = document.getElementById('eventTableBody');
    
    if (events.length === 0) {
        showNoEvents();
        return;
    }

    document.getElementById('noEvents').style.display = 'none';
    document.getElementById('eventTable').style.display = 'table';
    
    tbody.innerHTML = '';
    
    events.forEach(event => {
        const row = document.createElement('tr');
        row.id = `event-${event.id}`;
        
        if (currentEditingId == event.id) {
            row.classList.add('editing');
            row.innerHTML = `
                <td data-label="Event Name">
                    <input type="text" value="${escapeHtml(event.name)}" id="edit-name-${event.id}">
                </td>
                <td data-label="Start Date">
                    <input type="date" value="${event.startDate}" id="edit-start-${event.id}">
                </td>
                <td data-label="End Date">
                    <input type="date" value="${event.endDate}" id="edit-end-${event.id}">
                </td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="action-btn save-btn" data-action="save" data-id="${event.id}">
                            <svg viewBox="0 0 24 24">
                                <path d="M21,20V8.414a1,1,0,0,0-.293-.707L16.293,3.293A1,1,0,0,0,15.586,3H4A1,1,0,0,0,3,4V20a1,1,0,0,0,1,1H20A1,1,0,0,0,21,20ZM9,8h4a1,1,0,0,1,0,2H9A1,1,0,0,1,9,8Zm7,11H8V15a1,1,0,0,1,1-1h6a1,1,0,0,1,1,1Z"/>
                            </svg>
                        </button>
                        <button class="action-btn cancel-btn" data-action="cancel">
                            <svg viewBox="0 0 32 32">
                                <path d="M19.587 16.001l6.096 6.096c0.396 0.396 0.396 1.039 0 1.435l-2.151 2.151c-0.396 0.396-1.038 0.396-1.435 0l-6.097-6.096-6.097 6.096c-0.396 0.396-1.038 0.396-1.434 0l-2.152-2.151c-0.396-0.396-0.396-1.038 0-1.435l6.097-6.096-6.097-6.097c-0.396-0.396-0.396-1.039 0-1.435l2.153-2.151c0.396-0.396 1.038-0.396 1.434 0l6.096 6.097 6.097-6.097c0.396-0.396 1.038-0.396 1.435 0l2.151 2.152c0.396 0.396 0.396 1.038 0 1.435l-6.096 6.096z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td data-label="Event Name">${escapeHtml(event.name)}</td>
                <td data-label="Start Date">${formatDate(event.startDate)}</td>
                <td data-label="End Date">${formatDate(event.endDate)}</td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" data-action="edit" data-id="${event.id}">
                            <svg viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete-btn" data-action="delete" data-id="${event.id}">
                            <svg viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
        }
        
        tbody.appendChild(row);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Add event form
function showAddForm() {
    if (currentEditingId !== null) {
        cancelEdit();
    }
    isAddingEvent = true;
    document.getElementById('eventForm').classList.add('active');
    clearForm();
}

//Add event form
function hideAddForm() {
    isAddingEvent = false;
    document.getElementById('eventForm').classList.remove('active');
    clearForm();
}

// Clear form inputs
function clearForm() {
    document.getElementById('eventName').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    clearErrors();
}

// Clear error messages
function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.style.display = 'none');
    
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => input.classList.remove('error'));
}

// Validate form inputs
function validateForm() {
    let isValid = true;
    clearErrors();

    const name = document.getElementById('eventName').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!name) {
        showError('eventName', 'nameError');
        isValid = false;
    }

    if (!startDate) {
        showError('startDate', 'startDateError');
        isValid = false;
    }

    if (!endDate) {
        showError('endDate', 'endDateError');
        isValid = false;
    } else if (startDate && endDate < startDate) {
        showError('endDate', 'endDateError');
        isValid = false;
    }

    return isValid;
}

// Show error message
function showError(inputId, errorId) {
    document.getElementById(inputId).classList.add('error');
    document.getElementById(errorId).style.display = 'block';
}

// Save event (add or update)
async function saveEvent() {
    if (!validateForm()) {
        return;
    }

    const eventData = {
        name: document.getElementById('eventName').value.trim(),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            throw new Error('Failed to save event');
        }

        const savedEvent = await response.json();
        events.push(savedEvent);
        renderEvents();
        hideAddForm();
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Failed to save event. Please try again.');
    }
}

// Cancel form
function cancelForm() {
    hideAddForm();
}

// Edit event
function editEvent(id) {
    console.log('Edit event called with ID:', id); // Debug log
    if (isAddingEvent) {
        hideAddForm();
    }
    if (currentEditingId !== null && currentEditingId != id) {
        cancelEdit();
    }
    currentEditingId = id;
    console.log('Current editing ID set to:', currentEditingId); // Debug log
    renderEvents();
}

// Save edit
async function saveEdit(id) {
    console.log('Save edit called with ID:', id); // Debug log
    const nameInput = document.getElementById(`edit-name-${id}`);
    const startInput = document.getElementById(`edit-start-${id}`);
    const endInput = document.getElementById(`edit-end-${id}`);

    if (!nameInput || !startInput || !endInput) {
        console.error('Could not find input elements for ID:', id);
        alert('Error: Could not find input fields');
        return;
    }

    const name = nameInput.value.trim();
    const startDate = startInput.value;
    const endDate = endInput.value;

    if (!name || !startDate || !endDate) {
        alert('All fields are required');
        return;
    }

    if (endDate < startDate) {
        alert('End date must be after start date');
        return;
    }

    const eventData = {
        id: id,
        name: name,
        startDate: startDate,
        endDate: endDate
    };

    try {
        console.log('Sending PUT request for ID:', id, 'with data:', eventData);
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedEvent = await response.json();
        console.log('Updated event received:', updatedEvent);
        const index = events.findIndex(event => event.id == id);
        if (index !== -1) {
            events[index] = updatedEvent;
        } else {
            console.error('Could not find event with ID:', id, 'in events array');
        }
        
        currentEditingId = null;
        renderEvents();
    } catch (error) {
        console.error('Error updating event:', error);
        alert('Failed to update event. Please try again.');
    }
}

// Cancel edit
function cancelEdit() {
    console.log('Cancel edit called'); // Debug log
    currentEditingId = null;
    renderEvents();
}

// Delete event
async function deleteEvent(id) {
    console.log('Delete event called with ID:', id); // Debug log
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }

    try {
        console.log('Sending DELETE request for ID:', id);
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Event deleted successfully');
        events = events.filter(event => event.id != id);
        renderEvents();
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
    }
}