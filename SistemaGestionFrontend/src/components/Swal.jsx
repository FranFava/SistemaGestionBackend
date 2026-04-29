import Swal from 'sweetalert2';

const swalTheme = {
  background: '#1a1a2e',
  color: '#fff',
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33'
};

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#1a1a2e',
  color: '#fff'
});

export const toast = {
  success: (message) => Toast.fire({ icon: 'success', title: message }),
  error: (message) => Toast.fire({ icon: 'error', title: message }),
  warning: (message) => Toast.fire({ icon: 'warning', title: message }),
  info: (message) => Toast.fire({ icon: 'info', title: message })
};

export const confirm = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    ...swalTheme,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar'
  });
};

export const alert = (title, message, icon = 'info') => {
  return Swal.fire(title, message, icon);
};

export default Swal;