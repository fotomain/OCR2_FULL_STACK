import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>OCR2 Mobile Enterprise</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #0a0f1d;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          #early-error-fallback {
            display: none;
            padding: 24px;
            max-width: 580px;
            margin: 40px auto;
            background: #121a2f;
            border: 1px solid rgba(239, 68, 68, 0.4);
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 12px 36px rgba(0,0,0,0.5);
          }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('error', function(e) {
            if (e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
              var root = document.getElementById('root');
              var fallback = document.getElementById('early-error-fallback');
              if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
                if (fallback) fallback.style.display = 'block';
              }
            }
          }, true);
        `}} />
      </head>
      <body>
        <div id="early-error-fallback">
          <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(239, 68, 68, 0.15)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#ef4444' }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px 0', color: '#f8fafc' }}>
            Connection Refused: Local Service Offline
          </h2>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'monospace', fontSize: 12, color: '#fca5a5', margin: '12px 0', textAlign: 'left' }}>
            net::ERR_CONNECTION_REFUSED: Could not reach Metro bundler or Stage 1 OCR backend on localhost:8081 / 127.0.0.1:8000
          </div>
          <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: '1.6', margin: '12px 0' }}>
            The mobile application service is currently not running or was restarted.
          </p>
          <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, margin: '14px 0', fontSize: 12 }}>
            <strong style={{ color: '#38bdf8' }}>How to restore connection:</strong>
            <ol style={{ paddingLeft: 20, margin: '8px 0 0 0', color: '#cbd5e1', lineHeight: '1.8' }}>
              <li>Run <code style={{ color: '#34d399', fontWeight: 700 }}>./run_stage2_frontend_mobile</code> from your terminal</li>
              <li>Or run <code style={{ color: '#34d399', fontWeight: 700 }}>./start_all.sh</code> to launch all services</li>
              <li>Click <strong>Retry Connection</strong> below</li>
            </ol>
          </div>
          <button onClick={() => window.location.reload()} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, marginTop: 8 }}>
            🔄 Retry Connection
          </button>
        </div>
        {children}
      </body>
    </html>
  );
}
