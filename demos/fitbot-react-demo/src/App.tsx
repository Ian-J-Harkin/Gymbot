import { useState } from 'react'
import { FitBotWidget } from '@fitbot/react'

function App() {
    const [apiKey, setApiKey] = useState('');
    const API_URL = import.meta.env.VITE_FITBOT_API_URL || 'https://gymbot-production.up.railway.app';

    return (
        <div className="container" style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>FitBot React Integration Demo</h1>
            <p style={{ marginBottom: '2rem' }}>This is a standalone Vite + React app that consumes the <code>@fitbot/react</code> package.</p>

            <div className="card" style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <h2 style={{ marginTop: 0 }}>Test Your Live Widget</h2>
                <p>Paste your <strong>Gym ID</strong> (API Key) from the Admin Dashboard below to test your live configuration:</p>
                <input
                    type="text"
                    placeholder="e.g. cmlzi3vcz0000di1zcap1ejcr"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem' }}
                />

                {apiKey ? (
                    <div style={{ padding: '1rem', backgroundColor: '#e6ffe6', borderLeft: '4px solid #00cc00', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Widget Active!</p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Look for the chat button in the bottom right corner.</p>
                    </div>
                ) : (
                    <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107', borderRadius: '4px' }}>
                        <p style={{ margin: 0 }}>Waiting for API Key...</p>
                    </div>
                )}
            </div>

            {apiKey && (
                <FitBotWidget
                    apiKey={apiKey}
                    apiUrl={API_URL}
                    scriptUrl="/gymbot.min.js"
                />
            )}
        </div>
    )
}

export default App
