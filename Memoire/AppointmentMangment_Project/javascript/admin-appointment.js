let currentCard = null;

function updateAppointmentStatus(button, newStatus) {
    const card = button.closest('.appointment-card');
    const statusSpan = card.querySelector('.status');

    statusSpan.textContent = newStatus === 'confirmed' ? 'مؤكد' : 
                            newStatus === 'rejected' ? 'مرفوض' : 
                            newStatus === 'completed' ? 'مكتمل' : 'مؤجل';
    statusSpan.className = 'status ' + newStatus;
    card.setAttribute('data-status', newStatus);

    alert(`تم تحديث حالة الحجز إلى: ${statusSpan.textContent}`);
}

function postponeAppointment(button) {
    currentCard = button.closest('.appointment-card');
    const modal = document.getElementById('postponeModal');
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('postponeModal');
    modal.style.display = 'none';
    currentCard = null;
}

function submitPostpone(event) {
    event.preventDefault();

    const newDate = document.getElementById('newDate').value;
    const newTime = document.getElementById('newTime').value;

    if (!newDate || !newTime) {
        alert('يرجى إدخال التاريخ والوقت الجديدين!');
        return;
    }

    // Update the date and time in the appointment card
    const dateTimeSpan = currentCard.querySelector('.date-time');
    dateTimeSpan.textContent = `${newDate}, ${newTime}`;

    // Update the status to "مؤجل"
    updateAppointmentStatus(currentCard.querySelector('.action-btn'), 'postponed');

    // Close the modal
    closeModal();
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('postponeModal');
    if (event.target === modal) {
        closeModal();
    }
};