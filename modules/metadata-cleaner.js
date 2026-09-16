// ==========================================
// MODULE: METADATA CLEANER (LOSSLESS)
// ==========================================

(() => {
    const fileInput = document.getElementById('fileInput');
    const btnSelectFile = document.getElementById('btnSelectFile');
    const btnCleanMetadata = document.getElementById('btnCleanMetadata');
    const fileInfo = document.getElementById('fileInfo');
    const cleanerResult = document.getElementById('cleanerResult');
    const statusArea = document.getElementById('cleanerStatusArea');

    let currentFile = null;

    if (!btnSelectFile) return; // DOM load validation

    // Open file selector
    btnSelectFile.addEventListener('click', () => fileInput.click());

    // On file selection
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            currentFile = e.target.files[0];
            fileInfo.textContent = `${currentFile.name} (${(currentFile.size / 1024).toFixed(1)} KB)`;
            cleanerResult.textContent = "Ready to process.";
            statusArea.style.maxHeight = "300px";
            statusArea.style.opacity = "1";
        }
    });

    // Process metadata removal based on file type
    btnCleanMetadata.addEventListener('click', async () => {
        if (!currentFile) return;

        cleanerResult.textContent = "Processing bytes...";

        try {
            const arrayBuffer = await currentFile.arrayBuffer();
            let cleanedBlob = null;

            if (currentFile.type === "image/jpeg" || currentFile.name.toLowerCase().endsWith('.jpg')) {
                cleanedBlob = removeJpegExif(arrayBuffer);
            } else if (currentFile.type === "image/png" || currentFile.name.toLowerCase().endsWith('.png')) {
                cleanedBlob = removePngMetadata(arrayBuffer);
            } else {
                cleanerResult.textContent = "Format not yet supported for binary cleaning.";
                return;
            }

            // Download the clean file preserving 100% quality
            downloadFile(cleanedBlob, `clean_${currentFile.name}`);
            cleanerResult.textContent = "Metadata successfully removed!";
        } catch (err) {
            console.error(err);
            cleanerResult.textContent = "Error processing file.";
        }
    });

    // --- LOSSLESS BINARY ALGORITHMS ---

    // 1. JPEG Cleaning (Removes APP1/EXIF segments 0xFFE1)
    function removeJpegExif(buffer) {
        const dv = new DataView(buffer);
        let offset = 2; // Skip SOI marker (0xFFD8)
        const pieces = [buffer.slice(0, 2)];

        while (offset < dv.byteLength) {
            if (dv.getUint8(offset) !== 0xFF) break;

            const marker = dv.getUint8(offset + 1);
            
            // If we reach SOS (Start of Scan 0xDA), the rest is pure pixels
            if (marker === 0xDA) {
                pieces.push(buffer.slice(offset));
                break;
            }

            const length = dv.getUint16(offset + 2);

            // APP1 markers (0xE1) contain EXIF/XMP. We skip them.
            if (marker !== 0xE1) {
                pieces.push(buffer.slice(offset, offset + 2 + length));
            }

            offset += 2 + length;
        }

        return new Blob(pieces, { type: 'image/jpeg' });
    }

    // 2. PNG Cleaning (Removes text and metadata chunks: tEXt, zTXt, iTXt, eXIf)
    function removePngMetadata(buffer) {
        const bytes = new Uint8Array(buffer);
        const pieces = [bytes.subarray(0, 8)]; // Save 8-byte PNG signature
        let offset = 8;

        const metadataChunks = ['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME'];

        while (offset < bytes.length) {
            const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
            const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));

            const totalChunkLength = 12 + length; // 4 len + 4 type + data + 4 crc

            if (!metadataChunks.includes(type)) {
                pieces.push(bytes.subarray(offset, offset + totalChunkLength));
            }

            offset += totalChunkLength;
            if (type === 'IEND') break;
        }

        return new Blob(pieces, { type: 'image/png' });
    }

    // Helper function to download the generated Blob
    function downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
})();