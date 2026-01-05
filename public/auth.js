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
 * Actualiza el banner de bienvenida según el estado de autenticación
 */
async function handleWelcomeBanner() {
    const user = await getCurrentUser();
    const welcomeText = document.getElementById('welcome-text');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (user && welcomeText) {
        // Usuario autenticado: mostrar mensaje personalizado
        const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
        const createdAt = new Date(user.createdAt);
        
        // Si no hay lastLoginAt o es muy reciente (menos de 1 minuto desde creación), es primera vez
        const isFirstTime = !lastLogin || Math.abs(lastLogin - createdAt) < 60000;
        
        if (isFirstTime) {
            welcomeText.innerHTML = `
                ¡Bienvenido, <strong>${user.username}</strong>! Esta es tu primera visita
            `;
        } else {
            const lastVisit = lastLogin.toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            welcomeText.innerHTML = `
                ¡Bienvenido de vuelta, <strong>${user.username}</strong>! 
                Tu última visita fue el ${lastVisit}
            `;
        }
        
        // Mostrar botón de cerrar sesión
        if (logoutBtn) {
            logoutBtn.style.display = 'inline-block';
            logoutBtn.addEventListener('click', logout);
        }
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
