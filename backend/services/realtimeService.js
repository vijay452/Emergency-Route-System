let ioInstance = null;

function initializeRealtime(io) {
    ioInstance = io;

    io.on('connection', (socket) => {
        socket.emit('system:connected', {
            message: 'Connected to Emergency Route realtime channel',
            timestamp: new Date().toISOString()
        });
    });
}

function broadcast(event, payload) {
    if (ioInstance) {
        ioInstance.emit(event, {
            ...payload,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = {
    initializeRealtime,
    broadcast
};
