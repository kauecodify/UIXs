// # Instalar yt-dlp (baixe de: https://github.com/yt-dlp/yt-dlp/releases)
// # Coloque yt-dlp.exe no PATH do sistema

// # Instalar ffmpeg (necessário para converter para MP3)
// # Baixe em: https://ffmpeg.org/download.html

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Criar pasta de downloads se não existir
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

app.use(cors());
app.use(express.json());
app.use('/downloads', express.static(downloadsDir));

// Endpoint para baixar do YouTube
app.post('/api/download', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL obrigatória' });
    }

    // Nome único para o arquivo
    const timestamp = Date.now();
    const outputTemplate = path.join(downloadsDir, `${timestamp}_%(title)s.%(ext)s`);

    // Comando yt-dlp: extrai áudio e converte para MP3
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputTemplate}" --print after_move:filepath "${url}"`;

    console.log(`Baixando: ${url}`);

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error('Erro:', error.message);
            return res.status(500).json({
                error: 'Falha no download',
                details: stderr || error.message
            });
        }

        // Pegar o nome do arquivo baixado
        const filename = stdout.trim().split('\n').pop();
        const basename = path.basename(filename);

        // Extrair título do nome do arquivo
        const title = basename.replace('.mp3', '').replace(/^\d+_/, '');

        res.json({
            success: true,
            title: title,
            filename: basename,
            url: `http://localhost:${PORT}/downloads/${basename}`
        });
    });
});

// Listar músicas já baixadas
app.get('/api/downloads', (req, res) => {
    const files = fs.readdirSync(downloadsDir)
        .filter(f => f.endsWith('.mp3'))
        .map(f => ({
            filename: f,
            title: f.replace('.mp3', ''),
            url: `http://localhost:${PORT}/downloads/${f}`
        }));
    res.json(files);
});

// Deletar música baixada
app.delete('/api/downloads/:filename', (req, res) => {
    const filepath = path.join(downloadsDir, req.params.filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Arquivo não encontrado' });
    }
});

app.listen(PORT, () => {
    console.log(`🎵 Servidor Spotily rodando em http://localhost:${PORT}`);
    console.log(`📁 Downloads salvos em: ${downloadsDir}`);
});

// ou descomente o cód python abaixo mas antes instale o yt-dlp e ffmpeg e coloque no PATH do sistema, depois rode o python server.py

//ex: 

// pip install flask flask-cors yt-dlp
// python server.py

//---- >>>

// from flask import Flask, request, jsonify, send_from_directory
// from flask_cors import CORS
// import yt_dlp
// import os
// import re

// app = Flask(__name__)
// CORS(app)

// DOWNLOADS = 'downloads'
// os.makedirs(DOWNLOADS, exist_ok=True)

// @app.route('/api/download', methods=['POST'])
// def download():
//     url = request.json.get('url')
//     if not url:
//         return jsonify({'error': 'URL obrigatória'}), 400
    
//     ydl_opts = {
//         'format': 'bestaudio/best',
//         'postprocessors': [{
//             'key': 'FFmpegExtractAudio',
//             'preferredcodec': 'mp3',
//             'preferredquality': '192',
//         }],
//         'outtmpl': f'{DOWNLOADS}/%(title)s.%(ext)s',
//     }
    
//     try:
//         with yt_dlp.YoutubeDL(ydl_opts) as ydl:
//             info = ydl.extract_info(url, download=True)
//             title = info.get('title', 'audio')
//             filename = f"{re.sub(r'[^\w\s-]', '', title)}.mp3"
            
//             return jsonify({
//                 'success': True,
//                 'title': title,
//                 'filename': filename,
//                 'url': f'http://localhost:3000/downloads/{filename}'
//             })
//     except Exception as e:
//         return jsonify({'error': str(e)}), 500

// @app.route('/downloads/<path:filename>')
// def serve_file(filename):
//     return send_from_directory(DOWNLOADS, filename)

// if __name__ == '__main__':
//     app.run(port=3000)