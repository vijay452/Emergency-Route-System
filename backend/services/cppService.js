// Service for communicating with C++ engine
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CPPService {
    constructor() {
        this.cppProcess = null;
        this.initialized = false;
        this.stdoutBuffer = '';
        this.pendingResolvers = [];
    }

    // Initialize C++ process
    async initialize() {
        try {
            const base = path.join(__dirname, '../../core/route_engine');
            const cppPath = process.platform === 'win32' ? `${base}.exe` : base;

            if (!fs.existsSync(cppPath)) {
                throw new Error(`C++ route engine not found at ${cppPath}`);
            }

            this.cppProcess = spawn(cppPath, [], { stdio: ['pipe', 'pipe', 'pipe'] });

            this.cppProcess.stdout.on('data', (data) => {
                this.handleStdoutChunk(data.toString());
            });

            this.cppProcess.stderr.on('data', (data) => {
                console.error(`[C++ Engine Error] ${data}`);
            });

            this.cppProcess.on('exit', (code) => {
                this.initialized = false;
                while (this.pendingResolvers.length > 0) {
                    const pending = this.pendingResolvers.shift();
                    pending.reject(new Error(`C++ engine exited with code ${code}`));
                }
            });

            this.initialized = true;
        } catch (error) {
            console.warn('Warning: C++ engine not available, using JavaScript fallback');
            this.initialized = false;
        }
    }

    handleStdoutChunk(chunk) {
        this.stdoutBuffer += chunk;

        let newlineIndex = this.stdoutBuffer.indexOf('\n');
        while (newlineIndex !== -1) {
            const line = this.stdoutBuffer.slice(0, newlineIndex).trim();
            this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);

            if (line.length > 0 && this.pendingResolvers.length > 0) {
                const pending = this.pendingResolvers.shift();
                pending.resolve(line);
            }

            newlineIndex = this.stdoutBuffer.indexOf('\n');
        }
    }

    // Query C++ engine for route
    async findRoute(start, end, options = {}) {
        if (!this.initialized) {
            return null;
        }

        return new Promise((resolve, reject) => {
            try {
                const payload = {
                    start,
                    end,
                    algorithm: options.algorithm || 'dijkstra',
                    emergency_type: options.emergencyType || 'ambulance'
                };

                this.pendingResolvers.push({ resolve, reject });
                this.cppProcess.stdin.write(`${JSON.stringify(payload)}\n`);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Close C++ process
    close() {
        if (this.cppProcess) {
            this.cppProcess.kill();
        }
    }
}

module.exports = new CPPService();
