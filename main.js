const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Uruchamiamy malutki serwer lokalny w tle, żeby ominąć blokadę plików na Windowsie
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'src', req.url === '/' ? 'index.html' : req.url);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Nie znaleziono pliku: " + req.url);
            return;
        }
        
        // Automatyczne wykrywanie typów plików (CSS, JS, HTML)
        let ext = path.extname(filePath);
        let contentType = 'text/html';
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.js') contentType = 'text/javascript';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(3000, '127.0.0.1', () => {
    console.log('Lokalny serwer ruszył na porcie 3000');
});

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });


    // Ładujemy aplikację przez bezpieczny adres http zamiast file://
    win.loadURL('http://127.0.0.1:3000');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});