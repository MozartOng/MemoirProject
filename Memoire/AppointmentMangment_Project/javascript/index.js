function updateFields() {
    const role = document.getElementById('role')?.value;
    const visitReason = document.getElementById('visitReason')?.value;
    const fileUpload = document.getElementById('fileUpload');
    const workshopReason = document.getElementById('workshopReason');
    const workshopDetail = document.getElementById('workshopDetail');
    const workshopFiles = document.getElementById('workshopFiles');

    const reexecutionFiles = document.getElementById('reexecutionFiles');
    const concreteTestingFiles = document.getElementById('concreteTestingFiles');
    const concreteWorksFiles = document.getElementById('concreteWorksFiles');
    const soilFiles = document.getElementById('soilFiles');
    const notSpecifiedFiles = document.getElementById('notSpecifiedFiles');

    if (fileUpload) fileUpload.style.display = 'none';
    if (workshopReason) workshopReason.style.display = 'none';
    if (workshopFiles) workshopFiles.style.display = 'none';
    if (reexecutionFiles) reexecutionFiles.style.display = 'none';
    if (concreteTestingFiles) concreteTestingFiles.style.display = 'none';
    if (concreteWorksFiles) concreteWorksFiles.style.display = 'none';
    if (soilFiles) soilFiles.style.display = 'none';
    if (notSpecifiedFiles) notSpecifiedFiles.style.display = 'none';

    if (role === 'contractor' && visitReason === 'workshop') {
        if (workshopReason) workshopReason.style.display = 'block';
        if (workshopDetail.value !== 'none' && workshopFiles) {
            workshopFiles.style.display = 'block';
            if (workshopDetail.value === 'reexecution' && reexecutionFiles) reexecutionFiles.style.display = 'block';
            else if (workshopDetail.value === 'concreteTesting' && concreteTestingFiles) concreteTestingFiles.style.display = 'block';
            else if (workshopDetail.value === 'concreteWorks' && concreteWorksFiles) concreteWorksFiles.style.display = 'block';
            else if (workshopDetail.value === 'soil' && soilFiles) soilFiles.style.display = 'block';
            else if (workshopDetail.value === 'notSpecified' && notSpecifiedFiles) notSpecifiedFiles.style.display = 'block';
        }
    } 
    else if (visitReason === 'other' || visitReason === 'file' || visitReason === 'workshop') {
        if (fileUpload) fileUpload.style.display = 'block';
    }
}

document.getElementById('appointmentForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('تم تسجيل الحجز بنجاح!'); // Replace with actual submission logic
});