import subprocess
import json


def query_ai(message: str, timeout: int = 60) -> str:
    """Send a message to the AI agent using the openclaw CLI and return the response text.

    Raises ValueError if the response cannot be parsed or contains no text.
    Raises subprocess.CalledProcessError for CLI errors.
    """
    cmd = [
        'openclaw', 'agent', '--agent', 'main',
        '--message', message,
        '--deliver', '--reply-channel', 'matrix',
        '--json', '--verbose', 'off'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    # if cli exited with non-zero, propagate
    result.check_returncode()

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as e:
        raise ValueError(f'Failed to decode AI response: {e}\n{result.stdout}')

    text = None
    if isinstance(data, dict):
        res = data.get('result', {})
        payloads = res.get('payloads', [])
        if payloads and isinstance(payloads, list):
            first = payloads[0]
            text = first.get('text')
    if text is None:
        raise ValueError('No text field in AI response: ' + result.stdout)
    return text
