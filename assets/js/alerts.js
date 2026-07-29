/**
 * BookiSH SweetAlert2 Integration
 * Replaces default browser dialogs with themed popups.
 */

const swalTheme = {
    background: '#111111',
    color: '#FFFFFF',
    confirmButtonColor: '#d1a85b',
    cancelButtonColor: '#475569',
    borderRadius: '18px'
};

const BookishSwal = Swal.mixin({
    background: swalTheme.background,
    color: swalTheme.color,
    confirmButtonColor: swalTheme.confirmButtonColor,
    cancelButtonColor: swalTheme.cancelButtonColor,
    customClass: {
        popup: 'rounded-[18px] border border-slate-700 shadow-2xl',
        confirmButton: 'rounded-xl px-6 py-2.5 font-semibold text-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500 hover:brightness-110 active:scale-95 mx-2',
        cancelButton: 'rounded-xl px-6 py-2.5 font-semibold text-sm transition-all outline-none focus:ring-2 focus:ring-slate-400 hover:bg-slate-600 active:scale-95 mx-2',
        title: 'text-xl font-bold tracking-tight mt-2',
        htmlContainer: 'text-slate-300 text-sm mt-2 mb-4'
    },
    buttonsStyling: true
});

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: swalTheme.background,
    color: swalTheme.color,
    customClass: {
        popup: 'rounded-xl border border-slate-700 shadow-xl'
    },
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

// Helper Functions
window.showSuccess = function(title, message) {
    return BookishSwal.fire({
        icon: 'success',
        iconColor: '#10B981',
        title: title || 'Success!',
        text: message,
        confirmButtonText: 'Continue'
    });
};

window.showError = function(title, message) {
    return BookishSwal.fire({
        icon: 'error',
        iconColor: '#EF4444',
        title: title || 'Error',
        text: message,
        confirmButtonText: 'OK'
    });
};

window.showWarning = function(title, message) {
    return BookishSwal.fire({
        icon: 'warning',
        iconColor: '#F59E0B',
        title: title || 'Warning',
        text: message,
        confirmButtonText: 'OK'
    });
};

window.showInfo = function(title, message) {
    return BookishSwal.fire({
        icon: 'info',
        iconColor: '#d1a85b',
        title: title || 'Info',
        text: message,
        confirmButtonText: 'OK'
    });
};

window.showConfirmation = function(title, text, confirmText = 'Confirm', cancelText = 'Cancel') {
    return BookishSwal.fire({
        title: title,
        text: text,
        icon: 'question',
        iconColor: '#d1a85b',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true
    });
};

window.showLoading = function(message = 'Please wait while we process your request.') {
    return BookishSwal.fire({
        title: 'Loading...',
        text: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
};

window.hideLoading = function() {
    Swal.close();
};

window.showToast = function(message, icon = 'success') {
    const iconColors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#d1a85b'
    };
    return Toast.fire({
        icon: icon,
        title: message,
        iconColor: iconColors[icon]
    });
};
