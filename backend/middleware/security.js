const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

function applySecurity(app) {
    app.use(helmet({
        contentSecurityPolicy: false
    }));

    app.use(morgan('dev'));

    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            error: 'Too many requests, please retry in a few minutes.'
        }
    }));

    app.disable('x-powered-by');
}

module.exports = {
    applySecurity
};
