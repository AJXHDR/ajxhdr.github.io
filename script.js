// Algoritmo traducido a JS local nativo (0% internet)
async function generateCustomHash(inputText) {
    if (!inputText) return "";

    // 1. Convertir el texto a bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(inputText);

    // 2. Generar el SHA-256 en el navegador
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const byteSignature = new Int8Array(hashBuffer);

    // 3. Tu lógica de pool de caracteres y entropía
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

// Función modular para encadenar ejecuciones
async function runHashLoop(initialText, iterations) {
    let currentText = initialText;

    for (let i = 0; i < iterations; i++) {
        currentText = await generateCustomHash(currentText);
    }

    return currentText;
}

// 4. Escuchador del botón (PÓNLO AQUÍ ABAJO)
document.getElementById('btnGenerate').addEventListener('click', async () => {
    const textInput = document.getElementById('userInput').value.trim();
    const roundsInput = parseInt(document.getElementById('roundsInput').value) || 1;
    const resultDisplay = document.getElementById('hashResult');

    if (!textInput) {
        resultDisplay.textContent = "Input text first...";
        return;
    }

    resultDisplay.textContent = "Calculating...";

    try {
        const finalHash = await runHashLoop(textInput, roundsInput);
        resultDisplay.textContent = finalHash;
    } catch (error) {
        console.error("Error al generar el hash:", error);
        resultDisplay.textContent = "An error occurred.";
    }
});

// Copiar el hash al hacer clic en el resultado
document.getElementById('hashResult').addEventListener('click', async () => {
    const resultDisplay = document.getElementById('hashResult');
    const textToCopy = resultDisplay.textContent;

    // Ignora clics si es un mensaje de estado
    if (!textToCopy || textToCopy === "Input text first..." || textToCopy === "Calculating..." || textToCopy === "Copied to clipboard!" || textToCopy === "Waiting for text...") return;

    try {
        await navigator.clipboard.writeText(textToCopy);

        resultDisplay.textContent = "Copied to clipboard!";
        
        setTimeout(() => {
            // Reinicia la caja al mensaje inicial
            resultDisplay.textContent = "Waiting for text...";
            // 2. Limpia el campo de Number of Rounds
            document.getElementById('roundsInput').value = '';
            // Remueve el foco para comprimir el contenedor
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }, 500);
    } catch (err) {
        console.error("Error", err);
    }
});

// PWA Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('AJX PWA ready:', reg.scope))
            .catch(err => console.error('PWA registration failed:', err));
    });
}

// Detección automática de actualizaciones de la PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Recarga automática cuando hay una nueva versión lista
                        window.location.reload();
                    }
                });
            });
        });
    });
}