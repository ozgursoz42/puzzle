import bgScene from "@/assets/bg-scene.jpg";

/** Clean nature backdrop with no matte overlay and no foreground icons. */
export function Scenery() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={bgScene}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        width={1920}
        height={1200}
      />
    </div>
  );
}
