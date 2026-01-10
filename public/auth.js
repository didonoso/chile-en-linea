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
            const user = await response.json();
            
            // Verificar si el usuario está baneado
            if (user.isBanned) {
                // Solo redirigir si NO estamos en páginas públicas o en la página de baneo
                const publicPages = ['/', '/login', '/register', '/banned.html'];
                const currentPath = window.location.pathname;
                const isPublicPage = publicPages.some(page => currentPath === page || currentPath.startsWith(page));
                
                if (!isPublicPage && !currentPath.includes('/banned.html')) {
                    window.location.href = '/banned.html';
                    return null;
                }
            }
            
            return user;
        }
        
        // Si recibimos 403 (Forbidden), probablemente está baneado
        if (response.status === 403) {
            const publicPages = ['/', '/login', '/register', '/banned.html'];
            const currentPath = window.location.pathname;
            const isPublicPage = publicPages.some(page => currentPath === page || currentPath.startsWith(page));
            
            if (!isPublicPage && !currentPath.includes('/banned.html')) {
                window.location.href = '/banned.html';
            }
            return null;
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
    const adminBtn = document.getElementById('admin-btn');
    
    if (user && !user.isBanned && welcomeText) {
        // Usuario autenticado y NO baneado: mostrar mensaje personalizado
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

        // Mostrar botón de administrador solo para userGroupId === 4
        if (adminBtn && user.userGroupId === 4) {
            adminBtn.style.display = 'inline-block';
        }
    } else if (welcomeText) {
        // Usuario NO autenticado o baneado: mostrar links de registro/login
        welcomeText.innerHTML = `
            ¡Bienvenido a Chile en Línea! 
            <a href="/register" class="welcome-link">Regístrate</a> 
            o 
            <a href="/login" class="welcome-link">Inicia sesión</a> 
            para participar en la comunidad
        `;
        
        // Ocultar botones de usuario autenticado
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
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
