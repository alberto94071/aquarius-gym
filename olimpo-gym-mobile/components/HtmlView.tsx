import React, { useMemo, useState } from "react";
import { Linking, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Colors } from "@/constants/colors";

/**
 * Renderiza HTML tal cual se vería en un navegador (WebView real), con altura
 * automática. A diferencia de react-native-render-html, respeta <style>,
 * clases CSS, gradientes, tablas, emojis, etc. — el anuncio se ve en la app
 * exactamente igual que el HTML pegado en el CRM.
 */

const MEASURE_SCRIPT = `
<script>
  (function () {
    function post() {
      var h = Math.max(
        document.documentElement ? document.documentElement.scrollHeight : 0,
        document.body ? document.body.scrollHeight : 0
      );
      window.ReactNativeWebView.postMessage(String(h));
    }
    window.addEventListener("load", post);
    setTimeout(post, 250);
    setTimeout(post, 1000);
    if (window.ResizeObserver && document.body) {
      new ResizeObserver(post).observe(document.body);
    }
  })();
</script>`;

function buildDocument(html: string): string {
  // Si pegaron un documento HTML completo, solo inyectamos el script de altura
  if (/<html[\s>]/i.test(html)) {
    if (/<\/body>/i.test(html)) {
      return html.replace(/<\/body>/i, `${MEASURE_SCRIPT}</body>`);
    }
    return html + MEASURE_SCRIPT;
  }

  // Fragmento HTML: lo envolvemos con estilos base acordes al tema de la app
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  html, body {
    margin: 0; padding: 0;
    background: transparent;
    color: ${Colors.text};
    font-family: -apple-system, Roboto, "Segoe UI", sans-serif;
    font-size: 15px; line-height: 1.6;
    word-wrap: break-word;
  }
  img, video { max-width: 100%; height: auto; border-radius: 8px; }
  a { color: ${Colors.gold}; }
  table { max-width: 100%; border-collapse: collapse; }
  h1, h2, h3 { line-height: 1.3; }
</style>
</head>
<body>${html}${MEASURE_SCRIPT}</body>
</html>`;
}

export function HtmlView({ html }: { html: string }) {
  const [height, setHeight] = useState(0);
  const doc = useMemo(() => buildDocument(html), [html]);

  return (
    <View style={{ minHeight: height || 120 }}>
      {height === 0 && (
        <ActivityIndicator color={Colors.gold} style={{ marginTop: 24 }} />
      )}
      <WebView
        originWhitelist={["*"]}
        source={{ html: doc }}
        style={{ height: height || 120, backgroundColor: "transparent" }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled={false}
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
        onMessage={(e) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!Number.isNaN(h) && h > 0 && Math.abs(h - height) > 2) {
            setHeight(h);
          }
        }}
        onShouldStartLoadWithRequest={(req) => {
          // El documento se carga como about:blank/data; cualquier navegación
          // real (tocar un link) se abre fuera, en el navegador
          if (req.url.startsWith("http")) {
            Linking.openURL(req.url).catch(() => {});
            return false;
          }
          return true;
        }}
      />
    </View>
  );
}
