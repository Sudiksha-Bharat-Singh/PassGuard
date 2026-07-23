import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from analyzer import analyze_password, generate_secure_password
import database

FRONTEND_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_FOLDER)
CORS(app)

# Initialize Database
database.init_db()

@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_FOLDER, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(FRONTEND_FOLDER, path)):
        return send_from_directory(FRONTEND_FOLDER, path)
    return send_from_directory(FRONTEND_FOLDER, 'index.html')

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    data = request.get_json(silent=True) or {}
    password = data.get('password', '')
    
    if not isinstance(password, str):
        password = str(password)
        
    analysis = analyze_password(password)
    
    previously_analyzed = False
    if password.strip():
        previously_analyzed = database.check_and_save_password(
            password=password,
            strength=analysis['strength'],
            score=analysis['score']
        )
        
    analysis['previously_analyzed'] = previously_analyzed
    return jsonify(analysis)

@app.route('/api/generate', methods=['POST'])
def api_generate():
    data = request.get_json(silent=True) or {}
    try:
        length = int(data.get('length', 16))
    except (ValueError, TypeError):
        length = 16
        
    secure_pw = generate_secure_password(length)
    analysis = analyze_password(secure_pw)
    
    return jsonify({
        "password": secure_pw,
        "score": analysis["score"],
        "strength": analysis["strength"],
        "crack_time": analysis["crack_time"],
        "entropy": analysis["entropy"]
    })

@app.route('/api/history', methods=['GET'])
def api_get_history():
    history = database.get_history()
    return jsonify({
        "status": "success",
        "count": len(history),
        "history": history
    })

@app.route('/api/history', methods=['DELETE'])
def api_clear_history():
    database.clear_history()
    return jsonify({
        "status": "success",
        "message": "Analysis history cleared successfully."
    })

if __name__ == '__main__':
    print("Starting PassGuard Cybersecurity Server on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
