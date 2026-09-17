import { resolveLink } from './modules/link-resolver.js';
// ==========================================
// 1. MODULAR COMPONENT LOADER
// ==========================================
async function loadComponent(targetId, htmlPath, jsPath = null) {
    try {
        const response = await fetch(htmlPath);
        const html = await response.text();
        const target = document.getElementById(targetId);
        
        if (target) {
            target.innerHTML = html;
            
            // Inject module-specific JS if it exists and hasn't been loaded yet
            if (jsPath && !document.querySelector(`script[src="${jsPath}"]`)) {
                const script = document.createElement('script');
                script.src = jsPath;
                document.body.appendChild(script);
            }
        }
    } catch (error) {
        console.error(`Error loading ${htmlPath}:`, error);
    }
}

// Load modules when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadComponent('metadata-cleaner-container', './modules/metadata-cleaner.html', './modules/metadata-cleaner.js');
});

// ==========================================
// 2. HASH GENERATOR LOGIC
// ==========================================
async function generateCustomHash(inputText) {
    if (!inputText) return "";

    const encoder = new TextEncoder();
    const data = encoder.encode(inputText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const byteSignature = new Int8Array(hashBuffer);

    const charPool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    const poolLength = charPool.length;
    let result = "";

    for (let i = 0; i < 20; i++) {
        const byte1 = Math.abs(byteSignature[i]);
        const byte2 = Math.abs(byteSignature[(i + 12) % 32]); 
        const combinedValue = byte1 + byte2;
        const charIndex = combinedValue % poolLength;

        result += charPool[charIndex];
    }

    return result;
}

async function runHashLoop(initialText, iterations) {
    let currentText = initialText;
    for (let i = 0; i < iterations; i++) {
        currentText = await generateCustomHash(currentText);
    }
    return currentText;
}

document.getElementById('btnGenerate').addEventListener('click', async () => {
    const textInput = document.getElementById('userInput').value.trim();
    const roundsInput = parseInt(document.getElementById('roundsInput').value) || 1;
    const resultDisplay = document.getElementById('hashResult');

    if (!textInput) {
        resultDisplay.textContent = "Input text first...";
        resultDisplay.classList.remove('has-value'); // Keep dim
        return;
    }

    resultDisplay.textContent = "Calculating...";
    resultDisplay.classList.remove('has-value'); // Keep dim while thinking

    try {
        const finalHash = await runHashLoop(textInput, roundsInput);
        resultDisplay.textContent = finalHash;
        resultDisplay.classList.add('has-value'); // <--- TURN ON COLOR
    } catch (error) {
        console.error("Error generating hash:", error);
        resultDisplay.textContent = "An error occurred.";
        resultDisplay.classList.remove('has-value');
    }
});

document.getElementById('hashResult').addEventListener('click', async () => {
    const resultDisplay = document.getElementById('hashResult');
    const textToCopy = resultDisplay.textContent;

    if (!textToCopy || textToCopy === "Input text first..." || textToCopy === "Calculating..." || textToCopy === "Copied to clipboard!" || textToCopy === "Waiting for text...") return;

    try {
        await navigator.clipboard.writeText(textToCopy);
        resultDisplay.textContent = "Copied to clipboard!";
        
        setTimeout(() => {
            resultDisplay.textContent = "Waiting for text...";
            resultDisplay.classList.remove('has-value'); // <--- TURN OFF COLOR
            document.getElementById('roundsInput').value = '';
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }, 500);
    } catch (err) {
        console.error("Copy error:", err);
    }
});

// ==========================================
// 3. SERVICE WORKER & UPDATES
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('AJX PWA ready:', reg.scope);
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        window.location.reload();
                    }
                });
            });
        }).catch(err => console.error('PWA registration failed:', err));
    });
}

const resolverInput = document.getElementById('resolverInput');
const btnResolve = document.getElementById('btnResolve');
const resolverResult = document.getElementById('resolverResult');

btnResolve.addEventListener('click', async () => {
  const url = resolverInput.value.trim();
  if (!url) {
    alert('Please enter a valid link.');
    return;
  }

  btnResolve.disabled = true;
  btnResolve.textContent = 'Processing...';
  resolverResult.style.display = 'block';
  resolverResult.innerHTML = '<p>Fetching download link...</p>';

  const response = await resolveLink(url);

  btnResolve.disabled = false;
  btnResolve.textContent = 'Resolve & Download';

  if (response.success) {
    resolverResult.innerHTML = `
      <p><strong>Platform:</strong> ${response.platform}</p>
      <a href="${response.mediaUrl}" target="_blank" rel="noopener noreferrer" style="color: #0070f3; text-decoration: underline;">
        Open/Download ${response.type}
      </a>
    `;
  } else {
    resolverResult.innerHTML = `<p style="color: red;">Error: ${response.error || 'Could not resolve link.'}</p>`;
  }
});