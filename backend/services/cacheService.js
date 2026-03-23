const { LRUCache } = require('lru-cache');

const routeCache = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 10
});

const geocodeCache = new LRUCache({
    max: 1000,
    ttl: 1000 * 60 * 60
});

function routeCacheKey(payload) {
    return JSON.stringify(payload);
}

module.exports = {
    routeCache,
    geocodeCache,
    routeCacheKey
};
