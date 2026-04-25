'use client';

import { useEffect } from 'react';

export default function VLibras() {
  useEffect(() => {
    // Check if script already exists
    if (document.getElementById('vlibras-script')) return;

    const script = document.createElement('script');
    script.id = 'vlibras-script';
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      new window.VLibras.Widget('https://vlibras.gov.br/app');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed, though VLibras is usually global
    };
  }, []);

  return (
    <div className="vlibras-container">
      {/* @ts-ignore */}
      <div vw="true" className="enabled">
        {/* @ts-ignore */}
        <div vw-access-button="true" className="active"></div>
        {/* @ts-ignore */}
        <div vw-plugin-wrapper="true">
          <div className="vw-plugin-top-wrapper"></div>
        </div>
      </div>
    </div>
  );
}
