/* ============================================
   ADVANCED APP INTERACTIONS & ANIMATIONS
   Real-time Visualizations & Enhancements
   ============================================ */

// Enhanced Loading Animation
function enhanceLoadingState() {
    const loader = document.getElementById('loader');
    if (loader && loader.style.display !== 'none') {
        const spinner = loader.querySelector('.spinner');
        if (spinner) {
            spinner.style.animation = 'rotate 1s linear infinite';
        }
    }
}

// Show notification
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #2e7d32, #1b5e20)' : type === 'error' ? 'linear-gradient(135deg, #d32f2f, #b71c1c)' : 'linear-gradient(135deg, #f57c00, #e65100)'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        animation: slideInUp 0.4s ease-out;
        z-index: 999;
        font-weight: 500;
        font-size: 14px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.4s ease-in';
        setTimeout(() => notification.remove(), 400);
    }, duration);
}

// Enhanced dashboard updates with animation
function animateDashboardUpdate() {
    const stats = document.querySelectorAll('.dashboard-stat');
    stats.forEach((stat, index) => {
        stat.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`;
    });
}

// Route visualization enhancement
function enhanceRouteDisplay() {
    const routeDetails = document.querySelector('.route-details');
    if (routeDetails) {
        routeDetails.style.animation = 'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
}

// Traffic alert with polish
function showTrafficAlert(severity, message) {
    const alertBox = document.createElement('div');
    const bgColor = severity === 'critical' ? 'rgba(211, 47, 47, 0.1)' : severity === 'warning' ? 'rgba(245, 124, 0, 0.1)' : 'rgba(46, 125, 50, 0.1)';
    const borderColor = severity === 'critical' ? '#d32f2f' : severity === 'warning' ? '#f57c00' : '#2e7d32';
    
    alertBox.style.cssText = `
        background: ${bgColor};
        border-left: 4px solid ${borderColor};
        padding: 14px;
        margin: 12px 0;
        border-radius: 8px;
        font-size: 13px;
        animation: slideInLeft 0.3s ease-out;
    `;
    alertBox.innerHTML = `<strong>${severity.toUpperCase()}:</strong> ${message}`;
    
    return alertBox;
}

// Button ripple effect on click
function addRippleEffect(element) {
    element.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            animation: rippleEffect 0.6s ease-out;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
}

// Enhanced scroll animations
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.dashboard-stat, .history-item, .settings-group').forEach(el => {
        observer.observe(el);
    });
}

// Real-time stat updates with pulse effect
function pulseStatElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.animation = 'pulse 0.6s ease-out';
        setTimeout(() => {
            element.style.animation = 'none';
        }, 600);
    }
}

// Enhanced map control styling
function enhanceMapControls() {
    const mapBtns = document.querySelectorAll('.map-btn');
    mapBtns.forEach(btn => {
        btn.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        btn.addEventListener('mouseover', () => {
            btn.style.transform = 'scale(1.2)';
            btn.style.boxShadow = '0 8px 20px rgba(31, 115, 232, 0.3)';
        });
        btn.addEventListener('mouseout', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        });
    });
}

// Live update indicator
function showLiveUpdateIndicator() {
    const badge = document.createElement('div');
    badge.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #2e7d32, #1b5e20);
        color: white;
        padding: 8px 14px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        animation: slideInDown 0.3s ease-out;
        z-index: 450;
    `;
    badge.innerHTML = '<i class="fas fa-circle" style="color: #4caf50; margin-right: 6px;"></i> Live Updates Active';
    
    return badge;
}

// Enhanced panel opening animation
function enhancePanelAnimation() {
    const panelClose = document.querySelectorAll('.panel-close');
    panelClose.forEach(btn => {
        addRippleEffect(btn);
    });
}

// Real-time clock for dashboard
function updateDashboardTime() {
    const timeElement = document.getElementById('last-route-time');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    }
}

// Initialize all advanced features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        enhanceMapControls();
        enhancePanelAnimation();
        observeElements();
        animateDashboardUpdate();
        updateDashboardTime();
        
        // Update dashboard time every second
        setInterval(updateDashboardTime, 1000);
    }, 100);
});

// Monitor route finding and enhance display
const originalFindRoute = window.findRoute;
if (window.findRoute) {
    window.findRoute = async function() {
        enhancedShowLoader();
        try {
            return await originalFindRoute.apply(this, arguments);
        } finally {
            enhancedHideLoader();
        }
    };
}

function enhancedShowLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
        loader.style.animation = 'slideInUp 0.3s ease-out';
        enhanceLoadingState();
    }
}

function enhancedHideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.animation = 'slideOutDown 0.3s ease-in';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }
}

// Enhanced corridor mode visual feedback
function visualizeCorridorMode(enabled) {
    const controlPanel = document.querySelector('.emergency-control-panel');
    if (controlPanel) {
        if (enabled) {
            controlPanel.style.borderLeft = '5px solid #f57c00';
            controlPanel.style.boxShadow = '0 4px 20px rgba(245, 124, 0, 0.15)';
            showNotification('🚨 Green Corridor Mode Activated!', 'success');
        } else {
            controlPanel.style.borderLeft = '5px solid #ccc';
            controlPanel.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            showNotification('✓ Green Corridor Mode Deactivated', 'info');
        }
    }
}

// Export functions for use in other scripts
window.showNotification = showNotification;
window.visualizeCorridorMode = visualizeCorridorMode;
window.pulseStatElement = pulseStatElement;
window.showTrafficAlert = showTrafficAlert;
window.enhanceRouteDisplay = enhanceRouteDisplay;
