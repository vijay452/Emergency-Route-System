const { execSync } = require('child_process');

const TARGET_PORTS = [3000, 8000];

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

function getPidsByPort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
      const lines = output.split(/\r?\n/);
      const pids = new Set();

      for (const line of lines) {
        if (!line.includes('LISTENING')) continue;
        if (!line.includes(`:${port}`)) continue;

        const cols = line.trim().split(/\s+/);
        const pid = cols[cols.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }

      return [...pids];
    }

    const output = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' });
    return output
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter((v) => /^\d+$/.test(v));
  } catch {
    return [];
  }
}

for (const port of TARGET_PORTS) {
  const pids = getPidsByPort(port);

  if (pids.length === 0) {
    console.log(`[predev] Port ${port} is free`);
    continue;
  }

  for (const pid of pids) {
    const ok = killPid(pid);
    if (ok) {
      console.log(`[predev] Freed port ${port} by terminating PID ${pid}`);
    } else {
      console.log(`[predev] Could not terminate PID ${pid} on port ${port}`);
    }
  }
}
