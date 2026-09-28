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
    return { success: false, error: 'Connection error with backend.' };
  }
}

// Descarga directa utilizando el Proxy de Apps Script
export async function downloadFileDirectly(mediaUrl, filename = 'video.mp4') {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'proxy',
        mediaUrl: mediaUrl
      })
    });

    const data = await response.json();

    if (!data.success || !data.base64) {
      throw new Error(data.error || 'Failed to retrieve media proxy');
    }

    // Convertir Base64 a objeto Blob local
    const byteCharacters = atob(data.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: data.mimeType || 'video/mp4' });

    // Disparar descarga directa del navegador
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (error) {
    alert('Download failed: ' + error.message);
  }
}