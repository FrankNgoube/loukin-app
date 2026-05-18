import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ChefHat, Settings, QrCode, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();

  const demoMenuPath =
    "/ClientMenu?restaurant_id=demo-restaurant&table_id=t-1&table_number=1";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
      <section className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold mb-6">
          🇨🇲 Saveurs du Cameroun · Douala
        </div>
        <h1 className="text-4xl md:text-6xl font-black warm-gradient-text leading-tight">
          {t("welcome")}
        </h1>
        <p className="mt-4 text-stone-600 max-w-2xl mx-auto text-base md:text-lg">
          {t("homeHint")}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={demoMenuPath}>
            <Button size="lg" className="warm-gradient-bg text-white hover:opacity-95 border-0 shadow-lg">
              <QrCode className="h-5 w-5 mr-2" /> {t("demoMenu")}
            </Button>
          </Link>
          <Link to={createPageUrl("KitchenDashboard")}>
            <Button size="lg" variant="outline" className="bg-white">
              <ChefHat className="h-5 w-5 mr-2" /> {t("openKitchen")}
            </Button>
          </Link>
          <Link to={createPageUrl("AdminDashboard")}>
            <Button size="lg" variant="outline" className="bg-white">
              <Settings className="h-5 w-5 mr-2" /> {t("openAdmin")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-14 grid md:grid-cols-3 gap-4">
        {[
          { emoji: "🥬", title: "Ndolé", desc: "Plat emblématique aux arachides" },
          { emoji: "🍗", title: "Poulet DG", desc: "Mijoté avec plantain mûr" },
          { emoji: "🐟", title: "Poisson braisé", desc: "Au feu de bois, miondo" },
          { emoji: "🌿", title: "Eru", desc: "Feuilles & water-fufu" },
          { emoji: "🍢", title: "Brochettes", desc: "Bœuf mariné au piment doux" },
          { emoji: "🌺", title: "Bissap & Gingembre", desc: "Boissons fraîches du jour" },
        ].map((item, i) => (
          <div
            key={i}
            className="warm-card rounded-2xl p-5 warm-card-hover flex items-start gap-3"
          >
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
              {item.emoji}
            </div>
            <div>
              <div className="font-bold text-stone-900">{item.title}</div>
              <div className="text-sm text-stone-600">{item.desc}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-12 warm-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="h-16 w-16 rounded-2xl warm-gradient-bg flex items-center justify-center text-3xl shadow-lg">
          💵
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="font-black text-stone-900 text-lg">Paiement en espèces uniquement</div>
          <div className="text-sm text-stone-600">
            Pas de paiement intégré — réglez votre commande sur place. Numéros au format +237.
          </div>
        </div>
        <Link to={demoMenuPath}>
          <Button className="warm-gradient-bg text-white border-0">
            Essayer la commande <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
