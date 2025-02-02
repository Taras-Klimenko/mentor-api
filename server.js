const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/transcribe', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const audioPath = path.join(__dirname, 'uploads', req.file.filename);
  const transcriptionFile = path.join(__dirname, req.file.filename + '.txt');

  //Had to add set PYTHONIOENCODING=utf-8 to script because of the encoding problems, need to investigate

  const command = `set PYTHONIOENCODING=utf-8 && whisper "${audioPath}" --model base --language ru --output_format txt`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Whisper error:', stderr);
      return res.status(500).json({ error: 'Failed to transcribe audio' });
    }

    fs.readFile(transcriptionFile, 'utf8', (err, data) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Failed to read transcription' });
      }

      // Cleanup audio files and text transcript
      fs.unlinkSync(audioPath);
      fs.unlinkSync(transcriptionFile);

      res.json({ transcription: data.trim() });
    });
  });
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
