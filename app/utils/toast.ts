// Simple toast notification utility
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export function showToast(message: string, type: ToastType = 'info', duration: number = 3000) {
  // Get or create toast container
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.textContent = message;

  // Add to container
  container.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);

  return toast;
}

// Add slide out animation if not exists
if (typeof document !== 'undefined' && !document.getElementById('toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes toastSlideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
  `;
  document.head.appendChild(style);
}

