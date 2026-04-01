const path = require("node:path");
const { spawn } = require("node:child_process");

function normalizeRoot(rawRoot) {
  if (!rawRoot) {
    return process.cwd();
  }

  return rawRoot.startsWith("\\\\?\\") ? rawRoot.slice(4) : rawRoot;
}

const packageJsonPath = process.env.npm_package_json
  ? path.resolve(process.env.npm_package_json)
  : path.join(process.cwd(), "package.json");

const root = normalizeRoot(path.dirname(packageJsonPath));

const commands = {
  dev: [
    process.execPath,
    [path.join(root, "node_modules", "tsx", "dist", "cli.mjs"), "watch", path.join(root, "src", "server.ts")],
  ],
  build: [
    process.execPath,
    [path.join(root, "node_modules", "typescript", "bin", "tsc"), "-p", path.join(root, "tsconfig.json")],
  ],
  start: [process.execPath, [path.join(root, "dist", "server.js")]],
};

function run(commandName) {
  const command = commands[commandName];

  if (!command) {
    console.error(`Unknown runner command: ${commandName}`);
    process.exit(1);
  }

  const [file, args] = command;

  const child = spawn(file, args, {
    cwd: root,
    stdio: "inherit",
    windowsHide: false,
    env: process.env,
  });

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

module.exports = { run };

if (require.main === module) {
  run(process.argv[2]);
}
