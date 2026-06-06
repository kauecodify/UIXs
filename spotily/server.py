from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp
import os
import re

app = Flask(__name__)
CORS(app)

DOWNLOADS = 'downloads'
os.makedirs(DOWNLOADS, exist_ok=True)

@app.route('/api/download', methods=['POST'])
def download():
    url = request.json.get('url')
    if not url:
        return jsonify({'error': 'URL obrigatória'}), 400
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': f'{DOWNLOADS}/%(title)s.%(ext)s',
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'audio')
            filename = f"{re.sub(r'[^\w\s-]', '', title)}.mp3"
            
            return jsonify({
                'success': True,
                'title': title,
                'filename': filename,
                'url': f'http://localhost:3000/downloads/{filename}'
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/downloads/<path:filename>')
def serve_file(filename):
    return send_from_directory(DOWNLOADS, filename)

if __name__ == '__main__':
    app.run(port=3000)