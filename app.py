from flask import Flask, render_template, request, jsonify
import subprocess
import asyncio
from matrix_notifier import send_matrix_message

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/output')
def output():
    command = request.args.get('command')
    if not command:
        return 'No command provided', 400
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        output_text = result.stdout + result.stderr
        return render_template('output.html', command=command, output=output_text)
    except subprocess.TimeoutExpired:
        return render_template('output.html', command=command, output='Command timed out')
    except Exception as e:
        return render_template('output.html', command=command, output=str(e))

@app.route('/run_command', methods=['POST'])
def run_command():
    command = request.json.get('command')
    if not command:
        return jsonify({'error': 'No command provided'})
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        return jsonify({'output': result.stdout, 'error': result.stderr})
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Command timed out'})
@app.route('/ai_assistant')
def ai_assistant():
    return render_template('ai_assistant.html')

@app.route('/send_matrix', methods=['POST'])
def send_matrix():
    message = request.json.get('message')
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    
    # Run the async send_matrix_message function
    success = asyncio.run(send_matrix_message(message))
    
    if success:
        return jsonify({'status': 'Message sent to Matrix'})
    else:
        return jsonify({'error': 'Failed to send message to Matrix'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)