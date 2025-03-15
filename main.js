// main.js
const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

// Check environment to see if we're in development mode.
const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let serverProcess;

// Polls the provided URL until a successful response is received.
function waitForServer(url, interval = 500, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else if (Date.now() - startTime > timeout) {
            reject(new Error("Timeout waiting for server"));
          } else {
            setTimeout(check, interval);
          }
        })
        .on("error", () => {
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
    webPreferences: {
      // Disable Node.js integration in the renderer for security
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // In development, just load the Next.js dev server at localhost:3000
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // In production, spawn Next.js using the Electron-provided Node binary

    // 1. Path to Electron's built-in Node binary:
    const nodeBinary = process.execPath;

    // 2. Path to the Next CLI (installed in your node_modules)
    const nextCli = path.join(__dirname, "node_modules", "next", "dist", "bin", "next");

    // 3. Spawn "next start" directly with no shell
    serverProcess = spawn(nodeBinary, [nextCli, "start"], {
      cwd: __dirname,
      shell: false, // no cmd.exe, so no ENOENT
    });

    serverProcess.stdout.on("data", (data) => {
      console.log("Next.js stdout:", data.toString());
    });

    serverProcess.stderr.on("data", (data) => {
      console.error("Next.js stderr:", data.toString());
    });

    serverProcess.on("close", (code) => {
      console.log(`Next.js process exited with code ${code}`);
    });

    // Wait for Next.js to respond on http://localhost:3000 before loading
    waitForServer("http://localhost:3000")
      .then(() => {
        mainWindow.loadURL("http://localhost:3000");
      })
      .catch((err) => {
        console.error("Error waiting for Next.js server:", err);
        mainWindow.loadURL("data:text/html,<h1>Error starting Next.js server</h1>");
      });
  }
}

// Create the main window when Electron is ready
app.on("ready", createWindow);

// Gracefully kill the Next.js server when the app quits
app.on("quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Also kill the server if all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
