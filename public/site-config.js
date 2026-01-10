// Configuración del sitio cargada dinámicamente desde la API
let siteConfig = null;

async function loadSiteConfig() {
    try {
        const response = await fetch('/api/settings/public');
        if (response.ok) {
            siteConfig = await response.json();
            applySiteConfig();
        }
    } catch (error) {
        console.error('Error cargando configuración del sitio:', error);
    }
}

function applySiteConfig() {
    if (!siteConfig) return;

    // Actualizar el título de la página
    const titleElement = document.querySelector('title');
    if (titleElement && siteConfig.siteName) {
        const currentTitle = titleElement.textContent;
        // Reemplazar "Chile en Línea" por el nombre configurado
        titleElement.textContent = currentTitle.replace('Chile en Línea', siteConfig.siteName);
    }

    // Actualizar el header h1
    const headerTitle = document.querySelector('.forum-header h1');
    if (headerTitle && siteConfig.siteName) {
        headerTitle.textContent = siteConfig.siteName;
    }

    // Actualizar breadcrumbs
    const breadcrumbLinks = document.querySelectorAll('.breadcrumb a[href="/"]');
    breadcrumbLinks.forEach(link => {
        if (siteConfig.siteName && link.textContent === 'Chile en Línea') {
            link.textContent = siteConfig.siteName;
        }
    });

    // Actualizar welcome banner - solo el texto, no el HTML con enlaces
    const welcomeText = document.querySelector('.welcome-text');
    if (welcomeText && siteConfig.siteName) {
        // Usar innerHTML para preservar los enlaces
        welcomeText.innerHTML = welcomeText.innerHTML.replace(/Chile en Línea/g, siteConfig.siteName);
    }

    // Ocultar botón de registro si está deshabilitado
    if (!siteConfig.allowRegistration) {
        const registerButtons = document.querySelectorAll('a[href="/register"], .welcome-action[href="/register"]');
        registerButtons.forEach(btn => btn.style.display = 'none');
    }

    // Mostrar mensaje de mantenimiento si está activo
    if (siteConfig.maintenanceMode) {
        showMaintenanceMessage();
    }
}

function showMaintenanceMessage() {
    // Solo mostrar si no es admin
    fetch('/api/auth/me', { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(user => {
            if (!user || user.userGroupId !== 4) {
                const maintenanceDiv = document.createElement('div');
                maintenanceDiv.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                `;
                maintenanceDiv.innerHTML = `
                    <h1 style="font-size: 48px; margin-bottom: 20px;">🔧 Mantenimiento</h1>
                    <p style="font-size: 20px; text-align: center; max-width: 600px;">
                        ${siteConfig.maintenanceMessage || 'El foro está en mantenimiento. Volveremos pronto.'}
                    </p>
                `;
                document.body.appendChild(maintenanceDiv);
            }
        })
        .catch(() => {
            // Si hay error, asumir que no es admin y mostrar mensaje
            const maintenanceDiv = document.createElement('div');
            maintenanceDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            `;
            maintenanceDiv.innerHTML = `
                <h1 style="font-size: 48px; margin-bottom: 20px;">🔧 Mantenimiento</h1>
                <p style="font-size: 20px; text-align: center; max-width: 600px;">
                    ${siteConfig.maintenanceMessage || 'El foro está en mantenimiento. Volveremos pronto.'}
                </p>
            `;
            document.body.appendChild(maintenanceDiv);
        });
}

// Cargar configuración al iniciar la página
loadSiteConfig();
