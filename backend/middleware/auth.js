const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'emergency-route-system-dev-secret';

function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        return next();
    } catch (_error) {
        req.user = null;
        return next();
    }
}

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        return next();
    } catch (_error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        return next();
    };
}

function signUserToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '12h' }
    );
}

module.exports = {
    optionalAuth,
    requireAuth,
    requireRole,
    signUserToken
};
