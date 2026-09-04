import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/game/GameApp";

const title = "Puzzle Macerası — Çocuklar İçin Renkli Yapboz Oyunu";
const description =
  "3-9 yaş çocuklar için sevimli hayvanlar, manzaralar, ev, okul, park ve bahçe temalı, sürükle-bırak oynanan renkli puzzle oyunu.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <GameApp />;
}
