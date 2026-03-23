const { spawn } = require("child_process");
const path = require("path");

const isWindows = process.platform === "win32";
const binaryName = isWindows ? "cpp_backend_bin.exe" : "cpp_backend_bin";
const binaryPath = path.join(__dirname, "..", "core", binaryName);

const child = spawn(binaryPath, {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: process.env.PORT || "3000",
  },
});

child.on("error", (error) => {
  console.error(`Failed to start C++ backend binary: ${error.message}`);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
