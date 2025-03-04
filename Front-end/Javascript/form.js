document.getElementById('role').addEventListener('change', function() {
    var role = this.value;
    var visitPurpose = document.getElementById('visitPurpose').value;
    var additionalFields = document.getElementById('additionalFields');

    if (role === 'مقاول' && visitPurpose === 'ورشة') {
        additionalFields.style.display = 'block';
    } else {
        additionalFields.style.display = 'none';
    }
});

document.getElementById('visitPurpose').addEventListener('change', function() {
    var visitPurpose = this.value;
    var role = document.getElementById('role').value;
    var additionalFields = document.getElementById('additionalFields');

    if (visitPurpose === 'ورشة' && role === 'مقاول') {
        additionalFields.style.display = 'block';
    } else {
        additionalFields.style.display = 'none';
    }
});

document.getElementById('visitReason').addEventListener('change', function() {
    var visitReason = this.value;
    var attachmentsInfo = document.getElementById('attachmentsInfo');
    var requiredAttachments = document.getElementById('requiredAttachments');

    switch (visitReason) {
        case 'معاينة الحفر':
            requiredAttachments.textContent = 'المرفقات المطلوبة: صور بعد الحفر، تقرير المهندس،ملف دراسة الخرسانة(هذا الملف ضروري في بداية المشروع).';
            attachmentsInfo.style.display = 'block';
            break;
        case 'معاينة الأشغال':
            requiredAttachments.textContent = 'المرفقات المطلوبة: صور من موقع الأشغال الحالية، محضر استلام الاشغال المحرر من طرف مكتب المتابعة ، نتائج الخرسانة';
            attachmentsInfo.style.display = 'block';
            break;
        case 'معاينة أشغال المسالك':
            requiredAttachments.textContent = 'المرفقات المطلوبة: صور الموقع ، محضر استلام اشغال المساكنة محرر من طرف مكتب التابعة.';
            attachmentsInfo.style.display = 'block';
            break;
        case 'الاستلام المؤقت':
            requiredAttachments.textContent = 'المرفقات المطلوبة : صورة من الموقع ، دعوة محررة من طرف صاحب المشروع .';
            attachmentsInfo.style.display = 'block';
            break;
        case 'الاستلام النهائي':
            requiredAttachments.textContent = 'المرفقات المطلوبة: نسخة الاستلام المؤقت، دعوة محررة من طرف صاحب المشروع.';
            attachmentsInfo.style.display = 'block';
            break;
        default:
            attachmentsInfo.style.display = 'none';
            requiredAttachments.textContent = '';
            break;
    }
});

var selectedFiles = [];

document.getElementById('addFile').addEventListener('click', function() {
    document.getElementById('fileSelector').click();
});

document.getElementById('fileSelector').addEventListener('change', function() {
    var files = this.files;
    for (var file of files) {
        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الملف يجب ألا يتجاوز 5 ميغابايت');
        } else {
            selectedFiles.push(file);
            var li = document.createElement('li');
            li.appendChild(document.createTextNode(file.name));
            document.getElementById('selectedFiles').appendChild(li);
        }
    }
    this.value = '';
})


document.getElementById('appointmentForm').addEventListener('submit', function(event) {
    event.preventDefault();

    var FormData = new FormData(this);

    for (var file of selectedFiles) {
        FormData.append('attachments', file);
    }

    var appointmentData = {};
    FormData.forEach(function(value, key) {
        appointmentData[key] = value;
    });

    console.log('بيانات الموعد:', appointmentData);

    alert('تم إرسال طلبك بنجاح!');
    this.reset();
    document.getElementById('additionalFields').style.display = 'none';
    selectedFiles = [];
});
