const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const http = require('http');

const port = process.env.PORT || 3000;
let nextServer;

// Start Next.js server as a child process
function startNextServer() {
  nextServer = spawn('npm', ['run', 'start'], {
    cwd: __dirname,
    shell: true,
    stdio: 'inherit',
  });

  nextServer.on('error', (err) => {
    console.error('Error starting Next.js server:', err);
  });
}

// Poll the server until it's ready
function waitForServer(url, callback, retries = 20, interval = 500) {
  let attempts = 0;
  
  const checkServer = () => {
    http.get(url, (res) => {
      // Check if the server responds with a status in the 200s
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Server is ready!');
        callback();
      } else {
        console.log(`Server not ready yet (status: ${res.statusCode}). Retrying...`);
        retry();
      }
    }).on('error', (err) => {
      console.log(`Server not ready yet (error: ${err.message}). Retrying...`);
      retry();
    });
  };

  const retry = () => {
    attempts++;
    if (attempts > retries) {
      console.error('Server did not become ready in time.');
      // Optionally, handle the failure here (e.g., exit or show an error message)
    } else {
      setTimeout(checkServer, interval);
    }
  };

  checkServer();
}

// Create the Electron window and load the Next.js app
function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      // For security, disable Node integration in the renderer
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.maximize();

  // Uncomment to debug if needed
  // win.webContents.openDevTools();

  win.loadURL(`http://localhost:${port}`);
}

app.whenReady().then(() => {
  startNextServer();
  waitForServer(`http://localhost:${port}`, createWindow);
});

app.on('window-all-closed', () => {
  // Kill the Next.js server if running, then quit
  if (nextServer) nextServer.kill();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
