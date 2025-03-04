document.addEventListener('DOMContentLoaded', function() {
    const appointments = [
        {
            id: 1,
            clientName: 'أحمد علي',
            clientEmail: 'ahmed@example.com',
            clientPhone: '123456789',
            appointmentDate: '2025-03-05 10:00',
            status: 'قيد الانتظار'
        },
        {
            id: 2,
            clientName: 'سارة محمد',
            clientEmail: 'sara@example.com',
            clientPhone: '987654321',
            appointmentDate: '2025-03-06 14:00',
            status: 'مؤجل'
        }
    ];

    const modal = document.getElementById('appointmentDetailsModal');
    const acceptBtn = document.getElementById('acceptBtn');
    const rescheduleBtn = document.getElementById('rescheduleBtn');
    let selectedAppointment = null;

    function loadAppointments() {
        const tableBody = document.getElementById('appointmentsTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';

        appointments.forEach(appointment => {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = appointment.id;
            row.insertCell(1).textContent = appointment.clientName;
            row.insertCell(2).textContent = appointment.appointmentDate;
            row.insertCell(3).textContent = appointment.status;
            row.addEventListener('click', () => showDetails(appointment));
        });
    }

    function showDetails(appointment) {
        selectedAppointment = appointment;
        document.getElementById('appointmentId').textContent = appointment.id;
        document.getElementById('clientName').textContent = appointment.clientName;
        document.getElementById('clientEmail').textContent = appointment.clientEmail;
        document.getElementById('clientPhone').textContent = appointment.clientPhone;
        document.getElementById('appointmentDate').textContent = appointment.appointmentDate;
        document.getElementById('appointmentStatus').textContent = appointment.status;
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    acceptBtn.addEventListener('click', () => {
        if (selectedAppointment) {
            selectedAppointment.status = 'مقبول';
            alert(`تم قبول الموعد رقم ${selectedAppointment.id}`);
            closeModal();
            loadAppointments();
        }
    });

    rescheduleBtn.addEventListener('click', () => {
        if (selectedAppointment) {
            const newDate = prompt('أدخل التاريخ الجديد (YYYY-MM-DD HH:MM):', selectedAppointment.appointmentDate);
            if (newDate) {
                selectedAppointment.appointmentDate = newDate;
                selectedAppointment.status = 'مؤجل';
                alert(`تم تأجيل الموعد رقم ${selectedAppointment.id} إلى ${newDate}`);
                closeModal();
                loadAppointments();
            }
        }
    });

    loadAppointments();
});
