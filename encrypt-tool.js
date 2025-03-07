/**
 * Content Encryption Tool
 * This standalone script helps encrypt course content for secure storage in HTML
 */

// Function to encrypt content with AES-GCM
async function encryptContent(content, password) {
    // Hash the password to get a consistent key length
    const keyBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(password)
    );
    
    // Import the key for encryption
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );
    
    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the content
    const encodedContent = new TextEncoder().encode(content);
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        cryptoKey,
        encodedContent
    );
    
    // Combine IV and encrypted data
    const encryptedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    encryptedArray.set(iv);
    encryptedArray.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode.apply(null, encryptedArray));
}

// Function to read a file
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('encryption-app');
    
    // Create the UI
    app.innerHTML = `
        <div class="encryption-container">
            <h1>Course Content Encryption Tool</h1>
            
            <div class="input-group">
                <label for="content-file">Content File (HTML):</label>
                <input type="file" id="content-file" accept=".html">
            </div>
            
            <div class="input-group">
                <label for="password">Encryption Password:</label>
                <input type="password" id="password" placeholder="Enter password">
            </div>
            
            <button id="encrypt-btn">Encrypt Content</button>
            
            <div class="result-container hidden" id="result-container">
                <h2>Encrypted Content</h2>
                <p>Copy this encrypted content and add it as the <code>data-encrypted-content</code> attribute to your content div:</p>
                <textarea id="encrypted-output" readonly></textarea>
                <button id="copy-btn">Copy to Clipboard</button>
                
                <div class="instructions">
                    <h3>How to use the encrypted content:</h3>
                    <ol>
                        <li>Copy the encrypted string above</li>
                        <li>In your main HTML file, add it as an attribute to your content div:
                            <pre><code>&lt;div id="course-content" class="hidden" data-encrypted-content="YOUR_ENCRYPTED_CONTENT"&gt;&lt;/div&gt;</code></pre>
                        </li>
                        <li>Make sure you've included the decryption script in your main HTML file</li>
                    </ol>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .encryption-container {
            max-width: 800px;
            margin: 2rem auto;
            padding: 2rem;
            background-color: #f8f9fa;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        h1 {
            color: #2c3e50;
            margin-bottom: 1.5rem;
        }
        
        .input-group {
            margin-bottom: 1.5rem;
        }
        
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        
        input[type="file"], input[type="password"] {
            width: 100%;
            padding: 0.8rem;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            margin-bottom: 1.5rem;
        }
        
        button:hover {
            background-color: #2980b9;
        }
        
        .result-container {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #ddd;
        }
        
        textarea {
            width: 100%;
            height: 150px;
            padding: 0.8rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 1rem 0;
            font-family: monospace;
        }
        
        .instructions {
            margin-top: 2rem;
            padding: 1rem;
            background-color: #e8f4fc;
            border-left: 4px solid #3498db;
        }
        
        pre {
            background-color: #f1f1f1;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
        }
        
        .hidden {
            display: none;
        }
    `;
    document.head.appendChild(style);
    
    // Add event listeners
    const contentFileInput = document.getElementById('content-file');
    const passwordInput = document.getElementById('password');
    const encryptBtn = document.getElementById('encrypt-btn');
    const resultContainer = document.getElementById('result-container');
    const encryptedOutput = document.getElementById('encrypted-output');
    const copyBtn = document.getElementById('copy-btn');
    
    encryptBtn.addEventListener('click', async () => {
        if (!contentFileInput.files.length) {
            alert('Please select a content file');
            return;
        }
        
        if (!passwordInput.value) {
            alert('Please enter a password');
            return;
        }
        
        try {
            // Read the content file
            const content = await readFile(contentFileInput.files[0]);
            
            // Encrypt the content
            const encryptedContent = await encryptContent(content, passwordInput.value);
            
            // Display the result
            encryptedOutput.value = encryptedContent;
            resultContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Encryption failed:', error);
            alert('Encryption failed: ' + error.message);
        }
    });
    
    copyBtn.addEventListener('click', () => {
        encryptedOutput.select();
        document.execCommand('copy');
        alert('Encrypted content copied to clipboard!');
    });
}); 