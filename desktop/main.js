const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');

const LIVE_URL = 'https://dreamx-v46-full-package.nuwanidubusiness.workers.dev';
const OFFLINE_INDEX = path.join(__dirname, 'www', 'index.html');

function isAuthOrAppUrl(url) {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return (
      h.endsWith('nuwanidubusiness.workers.dev') ||
      h.endsWith('github.io') ||
      h.endsWith('firebaseapp.com') ||
      h.endsWith('web.app') ||
      h === 'accounts.google.com' ||
      h.endsWith('.google.com') ||
      h.endsWith('googleusercontent.com') ||
      h.endsWith('gstatic.com')
    );
  } catch (e) {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: '#0b0e14',
    title: 'DreamX Trading Hub',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.maximize();

  // Handle popups: allow Firebase / Google Sign-In popups in-app, open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAuthOrAppUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 680,
          backgroundColor: '#0b0e14',
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
          }
        }
      };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load live HTTPS site (instant auto-updates + full Google Auth), fallback to bundled v63 if offline
  let fellBack = false;
  win.webContents.on('did-fail-load', (_ev, code, _desc, validatedURL, isMainFrame) => {
    if (isMainFrame && !fellBack && validatedURL && validatedURL.startsWith('http')) {
      fellBack = true;
      win.loadFile(OFFLINE_INDEX);
    }
  });

  win.loadURL(LIVE_URL).catch(() => {
    if (!fellBack) {
      fellBack = true;
      win.loadFile(OFFLINE_INDEX);
    }
  });
}

app.whenReady().then(() => {
  // Clean standard Chrome UA so Google Sign-In works without Electron UA warnings
  const ua = session.defaultSession.getUserAgent().replace(/Electron\/\S+\s?/g, '');
  session.defaultSession.setUserAgent(ua);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
