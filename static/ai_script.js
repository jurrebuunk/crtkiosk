document.addEventListener('DOMContentLoaded', function () {
    const statusEl = document.getElementById('status');
    const transcriptEl = document.getElementById('transcript');
    const debugEl = document.getElementById('debug');
    const bars = document.querySelectorAll('.bar');
    let recognition;
    let animating = false;
    let animationMode = 'listening'; // 'listening' or 'loading'
    let lastTranscript = '';
    let hasAnswer = false;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        statusEl.textContent = 'Speech recognition not supported in this browser.';
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = function () {
        hasAnswer = false;
        statusEl.textContent = '';
        transcriptEl.textContent = '';
        debugEl.textContent = '';
        animationMode = 'listening';
        startListeningAnimation();
    };

    recognition.onresult = function (event) {
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
        }
        if (finalTranscript) {
            lastTranscript = finalTranscript;
            console.log('Final Transcript:', finalTranscript);

            // Send to Matrix
            debugEl.textContent = 'Sending to Matrix...';
            fetch('/send_matrix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: lastTranscript }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status) {
                        debugEl.textContent = 'Matrix: ' + data.status;
                    } else if (data.error) {
                        debugEl.textContent = 'Matrix Error: ' + data.error;
                    }
                })
                .catch(err => {
                    console.error('Error sending to Matrix:', err);
                    debugEl.textContent = 'Matrix Error: ' + err.message;
                });

            stopAnimation();
            transcriptEl.textContent = lastTranscript;
            showLoadingAnimation();
        }
    };

    recognition.onerror = function (event) {
        statusEl.textContent = 'Error: ' + event.error;
        if (event.error === 'network') {
            statusEl.textContent = 'Network error - check internet connection';
            stopAnimation();
            showLoadingAnimation();
        } else {
            stopAnimation();
        }
    };

    recognition.onend = function () {
        // Only stop if we're still in listening mode — don't kill the loading animation
        if (animationMode === 'listening') {
            stopAnimation();
        }
    };

    function showLoadingAnimation() {
        document.getElementById('spectrogram').style.display = 'flex';
        statusEl.textContent = '';
        animationMode = 'loading';
        startListeningAnimation();

        setTimeout(function () {
            stopAnimation();
            showAnswer();
        }, 4000);
    }

    function showAnswer() {
        document.getElementById('spectrogram').style.display = 'none';
        statusEl.textContent = '> ' + lastTranscript;
        transcriptEl.textContent = 'Test answer';
        hasAnswer = true;
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            if (!animating && !hasAnswer) {
                recognition.start();
            } else if (hasAnswer) {
                statusEl.textContent = '';
                transcriptEl.textContent = '';
                document.getElementById('spectrogram').style.display = 'flex';
                recognition.start();
            }
            event.preventDefault();
        }
    });

    function startListeningAnimation() {
        animating = true;
        animateBars();
    }

    function stopAnimation() {
        animating = false;
        bars.forEach(bar => bar.style.height = '20px');
    }

    function animateBars() {
        if (!animating) return;

        if (animationMode === 'listening') {
            bars.forEach((bar, index) => {
                const height = 20 + Math.random() * 80; // Random height
                bar.style.height = height + 'px';
            });
            // Slow down the random jitter slightly for visual clarity
            setTimeout(() => {
                if (animating) requestAnimationFrame(animateBars);
            }, 100);
        } else {
            // Loading animation: smooth wave
            const time = Date.now() / 1000;
            bars.forEach((bar, index) => {
                const height = 40 + Math.sin(time * 5 + index * 0.8) * 30;
                bar.style.height = height + 'px';
            });
            requestAnimationFrame(animateBars);
        }
    }
});
