from flask import Flask, render_template, request, jsonify
import subprocess

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)