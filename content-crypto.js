/**
 * Content Encryption and Decryption Script
 * This script handles the encryption and decryption of course content
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Content crypto script initialized');
    
    // Get DOM elements
    const passwordForm = document.getElementById('password-form');
    const courseContent = document.getElementById('course-content');
    const passwordInput = document.getElementById('password-input');
    const submitButton = document.getElementById('submit-password');
    const errorMessage = document.getElementById('error-message');
    
    // Get decryption key from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const decryptionKey = urlParams.get('key');
    
    console.log('Checking for decryption key in URL parameters');
    
    // Try to decrypt with URL parameter key if available
    if (decryptionKey) {
        console.log('Decryption key found in URL, attempting automatic decryption');
        try {
            decryptContent(decryptionKey);
        } catch (e) {
            console.error('Auto-decryption failed:', e);
        }
    } else {
        console.log('No decryption key in URL parameters, waiting for manual input');
    }
    
    // Keep the password form functionality as fallback
    submitButton.addEventListener('click', function() {
        const password = passwordInput.value;
        if (!password) {
            console.warn('Empty password submitted');
            errorMessage.textContent = 'Proszę wprowadzić hasło.';
            errorMessage.classList.remove('hidden');
            return;
        }
        
        console.log('Using submitted password for decryption');
        decryptContent(password);
    });
    
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const password = passwordInput.value;
            if (password) {
                console.log('Using submitted password for decryption (Enter key)');
                decryptContent(password);
            } else {
                console.warn('Empty password submitted via Enter key');
                errorMessage.textContent = 'Proszę wprowadzić hasło.';
                errorMessage.classList.remove('hidden');
            }
        }
    });
    
    async function decryptContent(key) {
        console.log('Starting content decryption with provided key');
        const encryptedData = courseContent.getAttribute('data-encrypted-content');
        if (!encryptedData) {
            console.warn('No encrypted data found');
            return;
        }
        
        try {
            console.log('Generating crypto key from password');
            // Get crypto key from password
            const keyBuffer = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(key)
            );
            
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );
            
            console.log('Decoding encrypted content');
            // Convert base64 to array
            const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            
            // Extract IV and encrypted data
            const iv = encryptedBytes.slice(0, 12);
            const data = encryptedBytes.slice(12);
            
            console.log('Performing decryption');
            // Decrypt the content
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                cryptoKey,
                data
            );
            
            // Convert to string and set as content
            const decryptedContent = new TextDecoder().decode(decryptedBuffer);
            console.log('Decryption successful, updating content');
            courseContent.innerHTML = decryptedContent;
            courseContent.removeAttribute('data-encrypted-content');
            
            // Show the content
            passwordForm.classList.add('hidden');
            courseContent.classList.remove('hidden');
            console.log('Content displayed successfully');
            
            // Store successful key in session storage for future use
            sessionStorage.setItem('courseDecryptionKey', key);
            console.log('Stored successful decryption key in session storage');
        } catch (error) {
            console.error('Decryption failed:', error);
            errorMessage.textContent = 'Nie udało się odszyfrować treści. Spróbuj wprowadzić hasło ręcznie.';
            errorMessage.classList.remove('hidden');
            console.warn('Decryption failed, waiting for manual password input');
        }
    }
}); 