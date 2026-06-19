const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data: Record<string, unknown>;
  channelId: string;
  image?: string;
}

export async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
  imageUrl?: string
): Promise<void> {
  if (tokens.length === 0) return;

  console.log(`[expo-push] Enviando a ${tokens.length} token(s)`);

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: data || {},
    channelId: "default",
    ...(imageUrl ? { image: imageUrl } : {}),
  }));

  // Expo acepta máximo 100 mensajes por request
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      console.error("[expo-push] HTTP error:", res.status, await res.text());
      continue;
    }

    // Parse ticket response to detect per-token errors
    try {
      const result = await res.json() as { data: Array<{ status: string; id?: string; message?: string; details?: unknown }> };
      for (const ticket of result.data ?? []) {
        if (ticket.status === "error") {
          console.error("[expo-push] Ticket error:", ticket.message, ticket.details);
        } else {
          console.log("[expo-push] Ticket ok:", ticket.id);
        }
      }
    } catch {
      console.error("[expo-push] No se pudo parsear respuesta de Expo");
    }
  }
}
