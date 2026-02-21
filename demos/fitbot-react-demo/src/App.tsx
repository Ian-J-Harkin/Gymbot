import { FitBotWidget } from '@fitbot/react'

function App() {
    // In a real app, this would come from an environment variable:
    // const API_KEY = import.meta.env.VITE_FITBOT_API_KEY;
    const API_KEY = 'demo-api-key-123';
    const API_URL = import.meta.env.VITE_FITBOT_API_URL || 'http://localhost:3000';

    return (
        <div className="container">
            <h1>FitBot React Integration Demo</h1>
            <p>This is a standalone Vite + React app that consumes the <code>@fitbot/react</code> package.</p>

            <div className="card">
                <p>The widget should appear in the corner of this page.</p>
                <p><strong>Note:</strong> Since we are local, make sure the backend is running or configured correctly for CORS if checking actual chat.</p>
                <p><em>Theme customization is currently a deferred enhancement.</em></p>
            </div>

            <FitBotWidget
                apiKey={API_KEY}
                apiUrl={API_URL}
                scriptUrl="/gymbot.min.js"
            />
        </div>
    )
}

export default App
