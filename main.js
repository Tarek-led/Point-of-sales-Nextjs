// main.js
const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const isDev = process.env.NODE_ENV === "development";
let mainWindow, serverProcess;

function waitForServer(url, interval = 500, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    function check() {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("Timeout waiting for server"));
        } else {
          setTimeout(check, interval);
        }
      }).on("error", () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error("Timeout waiting for server"));
        } else {
          setTimeout(check, interval);
        }
      });
    }
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: { nodeIntegration: false },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // In production, adjust paths to point to the unpacked app directory.
    const appPath = path.join(process.resourcesPath, "app");
    const nodeBinary = process.execPath;
    const nextCli = path.join(appPath, "node_modules", "next", "dist", "bin", "next");

    console.log("App path:", appPath);
    console.log("Node binary:", nodeBinary);
    console.log("Next CLI path:", nextCli);
    console.log("Next CLI exists?", fs.existsSync(nextCli));

    serverProcess = spawn(nodeBinary, [nextCli, "start"], {
      cwd: appPath,
      shell: false,
    });

    serverProcess.on("error", (err) => console.error("Error spawning Next.js process:", err));
    serverProcess.stdout.on("data", (data) => console.log("Next.js stdout:", data.toString()));
    serverProcess.stderr.on("data", (data) => console.error("Next.js stderr:", data.toString()));
    serverProcess.on("close", (code) => console.log(`Next.js process exited with code ${code}`));

    waitForServer("http://localhost:3000")
      .then(() => mainWindow.loadURL("http://localhost:3000"))
      .catch((err) => {
        console.error("Error waiting for Next.js server:", err);
        mainWindow.loadURL("data:text/html,<h1>Error starting Next.js server</h1>");
      });
  }
}

app.on("ready", createWindow);
app.on("quit", () => { if (serverProcess) serverProcess.kill(); });
app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
