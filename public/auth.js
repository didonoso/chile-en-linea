// auth.js - Manejo de autenticación en el frontend

/**
 * Verifica si el usuario está autenticado
 */
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Obtiene el usuario actual
 */
async function getCurrentUser() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Cierra sesión
 */
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

/**
 * Oculta el banner de bienvenida si está autenticado
 */
async function handleWelcomeBanner() {
    const isAuth = await checkAuth();
    const banner = document.getElementById('welcome-banner');
    
    if (isAuth && banner) {
        banner.style.display = 'none';
    }
}

/**
 * Actualiza la UI con información del usuario
 */
async function updateUserUI() {
    const user = await getCurrentUser();
    
    if (user) {
        // Actualizar authorId en formularios
        const authorIdInputs = document.querySelectorAll('[data-author-id]');
        authorIdInputs.forEach(input => {
            input.value = user.id;
        });
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    handleWelcomeBanner();
    updateUserUI();
});
