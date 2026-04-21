function refreshKeyState() {
    sendBtn.disabled = false;
    saveKeyBtn.textContent = '✓ Clé gérée côté serveur';
    saveKeyBtn.style.backgroundColor = '#00B140'; // jade green styling
    apiInput.disabled = true;
    apiInput.placeholder = 'Clé gérée côté serveur';
}