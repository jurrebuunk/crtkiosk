document.addEventListener('DOMContentLoaded', function() {
    const statusEl = document.getElementById('status');
    const transcriptEl = document.getElementById('transcript');
    const bars = document.querySelectorAll('.bar');
    let recognition;
    let animating = false;
    let lastTranscript = '';

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        statusEl.textContent = 'Speech recognition not supported in this browser.';
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        statusEl.textContent = 'Listening...';
        startAnimation();
    };

    recognition.onresult = function(event) {
        console.log('Result event:', event);
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        if (interimTranscript) {
            lastTranscript = interimTranscript;
            transcriptEl.textContent = 'Listening: ' + interimTranscript;
        }
        if (finalTranscript) {
            lastTranscript = finalTranscript;
            console.log('Final Transcript:', finalTranscript);
            transcriptEl.textContent = 'You said: ' + finalTranscript;
            statusEl.textContent = 'Press Enter to speak again';
            stopAnimation();
        }
    };

    recognition.onerror = function(event) {
        statusEl.textContent = 'Error: ' + event.error;
        stopAnimation();
    };

    recognition.onend = function() {
        if (!lastTranscript) {
            transcriptEl.textContent = 'No speech detected.';
        } else if (!transcriptEl.textContent) {
            transcriptEl.textContent = 'You said: ' + lastTranscript;
        }
        statusEl.textContent = '';
        stopAnimation();
    };

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            if (!animating) {
                recognition.start();
            }
            event.preventDefault();
        }
    });

    function startAnimation() {
        animating = true;
        animateBars();
    }

    function stopAnimation() {
        animating = false;
        bars.forEach(bar => bar.style.height = '20px');
    }

    function animateBars() {
        if (!animating) return;
        bars.forEach((bar, index) => {
            const height = 20 + Math.random() * 80; // Random height
            bar.style.height = height + 'px';
        });
        setTimeout(animateBars, 100);
    }
});
