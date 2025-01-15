// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 2098;

// Passwort aus der Konfigurationsdatei laden
const config = require('./config.json');
const DOWNLOAD_PASSWORD = config.downloadPassword;

// Multer-Konfiguration: Dateien mit ursprünglichem Namen und Dateiendung speichern
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Zielordner
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname); // Dateiendung
    const baseName = path.basename(file.originalname, ext); // Basisname ohne Endung
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// Multer initialisieren
const upload = multer({ storage });

// Statische Dateien bereitstellen
app.use(express.static('public'));

// Dateien im Upload-Ordner anzeigen
app.get('/files', (req, res) => {
  const directoryPath = path.join(__dirname, 'uploads');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Fehler beim Abrufen der Dateien.');
    }
    res.json(files);
  });
});

// Datei-Upload-Endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Keine Datei hochgeladen.');
  }
  res.send(`Datei hochgeladen: ${req.file.filename}`);
});

// Datei-Download-Endpoint mit Passwortschutz
app.get('/download/:file', (req, res) => {
  const file = req.params.file;
  const password = req.query.password;

  if (password !== DOWNLOAD_PASSWORD) {
    return res.status(403).send('Ungültiges Passwort.');
  }

  const filePath = path.join(__dirname, 'uploads', file);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('Datei nicht gefunden.');
  }
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});