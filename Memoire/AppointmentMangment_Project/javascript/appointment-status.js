function filterAppointments() {
    const statusFilter = document.getElementById('statusFilter')?.value;
    const appointmentCards = document.querySelectorAll('.appointment-card');

    if (!statusFilter) return;

    appointmentCards.forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        if (statusFilter === 'all' || cardStatus === statusFilter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

window.onload = function() {
    filterAppointments();
};