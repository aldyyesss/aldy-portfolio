import { spawn } from "node:child_process";
const children = ["@aldy/api", "@aldy/web"].map((workspace) =>
  spawn("npm", ["run", "dev", "--workspace", workspace], { stdio: "inherit" }),
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());
for (const child of children) child.on("exit", (code) => stop(code || 0));
