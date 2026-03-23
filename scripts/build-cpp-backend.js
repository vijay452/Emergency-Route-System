const { spawnSync } = require("child_process");
const path = require("path");

const isWindows = process.platform === "win32";
const compiler = process.env.CXX || "g++";
const source = path.join("core", "cpp_backend.cpp");
const output = path.join("core", isWindows ? "cpp_backend_bin.exe" : "cpp_backend_bin");

const args = ["-std=c++17", "-Wall", "-O2", "-o", output, source];
if (isWindows) {
  args.push("-lws2_32");
}

const result = spawnSync(compiler, args, { stdio: "inherit", shell: false });

if (result.error) {
  console.error(`Failed to start compiler '${compiler}': ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
