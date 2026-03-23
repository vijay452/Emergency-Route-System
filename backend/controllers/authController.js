const { getDb } = require('../services/dataStore');
const { signUserToken } = require('../middleware/auth');

function safeUser(user) {
    return {
        id: user.id,
        username: user.username,
        role: user.role
    };
}

exports.login = (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' });
    }

    const db = getDb();
    const user = db.data.users.find((u) => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signUserToken(user);

    return res.json({
        token,
        user: safeUser(user)
    });
};

exports.me = (req, res) => {
    return res.json({ user: req.user || null });
};
