// Reemplaza esta URL con la Web App URL que obtuviste al hacer el Deploy en Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbzvOQtiztpGF3K9Zwr4aAEcty2PN2a2asibdJ_OdlaEk_j81WOodZ_KhvMGM-3rJyko/exec';

export async function resolveLink(url) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ url: url })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Connection error with the backend.' };
  }
}

// Lógica de descarga directa vía Blob (1-Clic en iOS / Android / PC)
export async function downloadFileDirectly(mediaUrl, filename = 'video.mp4') {
  try {
    const response = await fetch(mediaUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Limpieza de memoria
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (error) {
    // Si la CDN bloquea fetch por CORS, abre el video en nueva pestaña como respaldo
    window.open(mediaUrl, '_blank');
  }
}