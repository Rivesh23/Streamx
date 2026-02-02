const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    backgroundColor: '#141414',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the frontend served by FastAPI
  // We add a retry mechanism or simple delay
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:8000').catch(e => console.log("Waiting for backend..."));
  }, 2000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startBackend() {
  // Adjust 'python' to 'python3' if needed. 
  // We assume the user has set up the venv or global python.
  const scriptPath = path.join(__dirname, '..', 'backend', 'main.py');
  console.log("Starting backend from:", scriptPath);
  
  backendProcess = spawn('python', [scriptPath], {
    cwd: path.join(__dirname, '..', 'backend') // Set CWD to backend dir so relative paths work
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });
}

app.on('ready', () => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (backendProcess) {
      backendProcess.kill();
  }
});
