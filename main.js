const { app, BrowserWindow } = require("electron");
const { exec } = require("child_process");
const path = require("path");

// If you used to do "require('electron-is-dev')", you can add it back,
// but let's keep it even simpler by checking NODE_ENV.
const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let serverProcess;

function createWindow() {
  // Create the main browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Development: load http://localhost:3000
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // Production: run "npm run start" to serve Next.js on port 3000
    // Then load http://localhost:3000 in the window.

    // Start the Next.js server on port 3000
    serverProcess = exec("npm run start", { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error("Next.js server error:", error);
      }
      if (stdout) console.log("Next.js server stdout:", stdout);
      if (stderr) console.error("Next.js server stderr:", stderr);
    });

    // Immediately load http://localhost:3000
    // (We’re not waiting for Next.js to finish booting, so the user might see a white screen for a second or two)
    mainWindow.loadURL("http://localhost:3000");
  }
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  // Kill the Next.js server process if it's still running
  if (serverProcess) {
    serverProcess.kill();
  }
  // Quit if not on macOS
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
