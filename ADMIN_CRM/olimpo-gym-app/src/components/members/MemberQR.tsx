"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { QrCode, Printer } from "lucide-react";

export function MemberQR({ code, name }: { code: string; name: string }) {
  const [expanded, setExpanded] = useState(false);

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Carné QR - ${name}</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; }
        .card { border: 2px solid #00D4E8; border-radius: 16px; padding: 32px; text-align: center; max-width: 300px; }
        h1 { color: #00D4E8; font-size: 22px; margin: 0 0 4px; }
        p { color: #444; font-size: 13px; margin: 0 0 20px; }
        .code { font-family: monospace; font-size: 14px; color: #666; margin-top: 16px; }
        .gym { font-size: 11px; color: #999; margin-top: 8px; }
      </style></head>
      <body>
        <div class="card">
          <h1>AQUARIUS GYM</h1>
          <p>${name}</p>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${document.getElementById("qr-svg-" + code)?.getAttribute("viewBox") || "0 0 200 200"}" width="200" height="200">
            ${document.getElementById("qr-svg-" + code)?.innerHTML || ""}
          </svg>
          <p class="code">${code}</p>
          <p class="gym">Acceso al gimnasio</p>
        </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="card-olimpo p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <QrCode className="w-5 h-5 text-olimpo-gold" />
        <h3 className="font-medium text-olimpo-text">Código QR de Acceso</h3>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div
          className="bg-white p-3 rounded-xl cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setExpanded(true)}
          title="Clic para ampliar"
        >
          <QRCodeSVG
            id={`qr-svg-${code}`}
            value={code}
            size={120}
            level="H"
            includeMargin={false}
          />
        </div>
        <p className="font-mono text-xs text-olimpo-text-muted">{code}</p>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-olimpo-gold text-olimpo-gold hover:bg-olimpo-gold/10 transition-colors text-sm font-medium"
        >
          <Printer className="w-4 h-4" />
          Imprimir carné
        </button>
      </div>

      {/* Lightbox */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <p className="text-gray-800 font-semibold text-lg">{name}</p>
            <QRCodeSVG value={code} size={240} level="H" includeMargin />
            <p className="font-mono text-gray-500 text-sm">{code}</p>
            <p className="text-xs text-gray-400">Toca fuera para cerrar</p>
          </div>
        </div>
      )}
    </div>
  );
}
