import { getHomeContent } from "@/actions/homeContent";
import { HomeContentClient } from "@/components/content/HomeContentClient";
import { Tv2 } from "lucide-react";

export default async function ContentPage() {
  const items = await getHomeContent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-olimpo-gold flex items-center gap-3">
          <Tv2 className="w-6 h-6" /> Contenido App
        </h1>
        <p className="text-olimpo-text-muted text-sm mt-1">
          Videos motivacionales, artículos de salud y tips que verán los miembros en el inicio de la app.
        </p>
      </div>
      <HomeContentClient items={items} />
    </div>
  );
}
