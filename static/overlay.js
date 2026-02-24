document.addEventListener('DOMContentLoaded', function() {
    // If overlay markup is already in HTML, just grab it, otherwise create dynamically
    let overlay = document.getElementById('ai-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ai-overlay';
        overlay.classList.add('hidden');
        overlay.innerHTML = `
            <div class="overlay-spectrogram">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const bars = overlay.querySelectorAll('.bar');
    let animating = false;
    let recognition;
    let animationMode = 'listening'; // listening or loading
    let pendingMessage = null;

    // create a small debug label if not present
    let debugEl = overlay.querySelector('#overlay-debug');
    if (!debugEl) {
        debugEl = document.createElement('div');
        debugEl.id = 'overlay-debug';
        debugEl.style.position = 'absolute';
        debugEl.style.bottom = '20px';
        debugEl.style.color = '#fff';
        debugEl.style.fontSize = '20px';
        overlay.appendChild(debugEl);
    }

    // create an output element for AI response
    let outputEl = overlay.querySelector('#overlay-output');
    if (!outputEl) {
        outputEl = document.createElement('div');
        outputEl.id = 'overlay-output';
        outputEl.style.position = 'absolute';
        outputEl.style.top = '60%';
        outputEl.style.left = '50%';
        outputEl.style.transform = 'translate(-50%, -50%)';
        outputEl.style.color = '#fff';
        outputEl.style.fontSize = '24px';
        outputEl.style.textAlign = 'center';
        outputEl.style.maxWidth = '80%';
        overlay.appendChild(outputEl);
    }

    function setDebug(text) {
        console.log('Overlay:', text);
        debugEl.textContent = text;
    }

    function startAnimation() {
        animating = true;
        animateBars();
    }

    function speakText(text) {
        if (!('speechSynthesis' in window)) {
            setDebug('speechSynthesis unavailable');
            return;
        }
        // cancel any previous utterance
        window.speechSynthesis.cancel();
        let utter = new SpeechSynthesisUtterance(text);
        // ensure we have voices loaded
        let voices = window.speechSynthesis.getVoices();
        if (!voices.length) {
            // voices might load asynchronously
            window.speechSynthesis.addEventListener('voiceschanged', () => {
                voices = window.speechSynthesis.getVoices();
                if (voices.length) {
                    utter.voice = voices[0];
                    setDebug('using voice ' + utter.voice.name);
                    window.speechSynthesis.speak(utter);
                }
            });
            setDebug('voices loading...');
        } else {
            utter.voice = voices[0];
            setDebug('using voice ' + utter.voice.name);
            window.speechSynthesis.speak(utter);
        }
        utter.onstart = () => setDebug('speech started');
        utter.onend = () => setDebug('speech ended');
        utter.onerror = (e) => setDebug('speech error ' + e.error);
    }

    function stopAnimation() {
        animating = false;
        bars.forEach(bar => bar.style.height = '20px');
    }

    function animateBars() {
        if (!animating) return;
        if (animationMode === 'listening') {
            // random jitter like original script
            bars.forEach((bar) => {
                const height = 20 + Math.random() * 80;
                bar.style.height = height + 'px';
            });
            setTimeout(() => { if (animating) requestAnimationFrame(animateBars); }, 100);
        } else {
            // loading wave
            const time = Date.now() / 1000;
            bars.forEach((bar, index) => {
                const height = 40 + Math.sin(time * 5 + index * 0.8) * 30;
                bar.style.height = height + 'px';
            });
            requestAnimationFrame(animateBars);
        }
    }

    function startListening() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser.');
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = function () {
            animationMode = 'listening';
            startAnimation();
        };

        recognition.onresult = function (event) {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                }
            }
            if (finalTranscript) {
                pendingMessage = finalTranscript.trim();
                setDebug('final: ' + pendingMessage);
                // switch to loading animation while sending
                animationMode = 'loading';
                startAnimation();
                sendToAI(pendingMessage);
            }
        };

        recognition.onerror = function (event) {
            setDebug('recognition error ' + event.error);
            console.error('Recognition error', event.error);
            if (pendingMessage) {
                // try sending what we already captured
                setDebug('onerror sending pending');
                animationMode = 'loading';
                startAnimation();
                sendToAI(pendingMessage);
            } else {
                // no message, just close
                hideOverlay();
            }
        };

        recognition.onend = function () {
            if (animationMode === 'listening') {
                stopAnimation();
            }
            // if we have a pending message but no send occurred (perhaps recognition ended before result event)
            if (pendingMessage) {
                setDebug('ending, sending pending: ' + pendingMessage);
                animationMode = 'loading';
                startAnimation();
                sendToAI(pendingMessage);
            }
        };

        recognition.start();
    }

    function sendToAI(message) {
        setDebug('AI request: ' + message);
        outputEl.textContent = '';
        // clear pending right away to prevent repeated attempts
        pendingMessage = null;
        animationMode = 'loading';
        startAnimation();

        fetch('/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.text) {
                    outputEl.textContent = data.text;
                    // hide bars/animation now that we have an answer
                    const spec = overlay.querySelector('.overlay-spectrogram');
                    if (spec) spec.style.display = 'none';
                    // speak it aloud
                    speakText(data.text);
                } else if (data.error) {
                    outputEl.textContent = 'Error: ' + data.error;
                } else {
                    outputEl.textContent = 'Unexpected response';
                }
                stopAnimation();
            })
            .catch(err => {
                outputEl.textContent = 'Fetch error';
                console.error('Fetch error', err);
                stopAnimation();
            });
    }

    function showOverlay() {
        overlay.classList.remove('hidden');
        animationMode = 'listening';
        outputEl.textContent = '';
        // make sure bars are visible when opened
        const spec = overlay.querySelector('.overlay-spectrogram');
        if (spec) spec.style.display = 'flex';
        startListening();
        startAnimation();
    }

    function hideOverlay() {
        overlay.classList.add('hidden');
        stopAnimation();
        if (recognition) {
            recognition.abort();
            recognition = null;
        }
    }

    function toggleOverlay() {
        if (overlay.classList.contains('hidden')) {
            showOverlay();
        } else {
            hideOverlay();
        }
    }

    document.addEventListener('keydown', function (e) {
        // Enter triggers overlay instead of alt+space
        if (e.key === 'Enter') {
            e.preventDefault();
            toggleOverlay();
        }
    });
});
