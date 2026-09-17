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
    return { success: false, error: 'Error de conexión con el servidor.' };
  }
}