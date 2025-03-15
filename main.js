const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let serverProcess;

// Poll the server until it's up
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
      nodeIntegration: false, // for security
    },
  });

  if (isDev) {
    // In dev mode, just load the dev server
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // 1. Path to the local Next CLI in node_modules
    //    (after packaging, asar must be disabled or unpacked)
    const nextBin = path.join(__dirname, "node_modules", ".bin", "next");

    // Debug check: see if nextBin exists
    console.log("Looking for Next CLI at:", nextBin);
    console.log("Exists?", fs.existsSync(nextBin));

    // 2. Spawn "next start" with no shell
    serverProcess = spawn(nextBin, ["start"], {
      cwd: __dirname,  // The working directory
      shell: false,    // Don't use cmd.exe or any shell
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

    // 3. Wait for the server to be ready before loading the window
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

app.on("ready", createWindow);

app.on("quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

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
