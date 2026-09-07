import { useState, useMemo } from "react";
import { ALL_LANGUAGES, TOP_LANGUAGES, OTHER_LANGUAGES, type Language } from "@/game/i18n";
import { ToyButton } from "./ui";

type Props = {
  currentLang: string;
  onSelect: (langId: string) => void;
  onClose: () => void;
};

export function LanguageModal({ currentLang, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");

  const filteredTop = useMemo(() => {
    if (!query.trim()) return TOP_LANGUAGES;
    const q = query.toLowerCase();
    return TOP_LANGUAGES.filter(
      (l) =>
        l.nameTr.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q),
    );
  }, [query]);

  const filteredOther = useMemo(() => {
    if (!query.trim()) return OTHER_LANGUAGES;
    const q = query.toLowerCase();
    return OTHER_LANGUAGES.filter(
      (l) =>
        l.nameTr.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl border-4 border-amber-300 bg-gradient-to-b from-amber-50 to-orange-50 p-4 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-amber-200">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🌐</span>
            <div>
              <h2 className="font-display text-xl font-extrabold text-amber-950 sm:text-2xl">
                Language / Dil Seçimi
              </h2>
              <p className="text-xs font-bold text-amber-700">72 language options available</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200 text-lg font-bold text-amber-900 transition hover:bg-amber-300 active:scale-95"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div className="my-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Dil ara / Search language..."
              className="w-full rounded-2xl border-2 border-amber-300 bg-white px-4 py-2.5 pl-10 font-display text-sm font-bold text-amber-950 placeholder:text-amber-700/60 focus:border-orange-500 focus:outline-hidden"
            />
            <span className="pointer-events-none absolute left-3 top-2.5 text-lg">🔍</span>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-2.5 text-sm font-bold text-amber-800 hover:text-amber-950"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Language List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Top 6 Priority Languages */}
          {filteredTop.length > 0 && (
            <div>
              <div className="mb-2 font-display text-xs font-extrabold tracking-wider text-amber-800 uppercase">
                ⭐ Öne Çıkan Diller / Featured Languages
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filteredTop.map((l, index) => {
                  const active = currentLang === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        onSelect(l.id);
                        onClose();
                      }}
                      className={`flex items-center justify-between rounded-2xl border-2 p-2.5 text-left transition-all ${
                        active
                          ? "border-orange-500 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md ring-2 ring-orange-300"
                          : "border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{l.flag}</span>
                        <div>
                          <div
                            className={`font-display text-sm font-extrabold ${
                              active ? "text-white" : "text-amber-950"
                            }`}
                          >
                            {l.nativeName}
                          </div>
                          <div
                            className={`text-[11px] font-semibold ${
                              active ? "text-amber-100" : "text-amber-700/80"
                            }`}
                          >
                            {l.nameTr} {index === 0 && "(Default)"} {index === 1 && "(2. Dil)"}
                          </div>
                        </div>
                      </div>
                      {active && <span className="font-extrabold text-sm">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Other Languages (Alphabetical) */}
          {filteredOther.length > 0 && (
            <div>
              <div className="mb-2 font-display text-xs font-extrabold tracking-wider text-amber-800 uppercase">
                📖 Tüm Diller / All Languages (A-Z)
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {filteredOther.map((l) => {
                  const active = currentLang === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        onSelect(l.id);
                        onClose();
                      }}
                      className={`flex items-center justify-between rounded-xl border p-2 text-left transition-all ${
                        active
                          ? "border-orange-500 bg-amber-500 text-white shadow-xs font-bold"
                          : "border-amber-200/80 bg-white/90 hover:border-amber-300 hover:bg-amber-50/80 text-amber-950"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{l.flag}</span>
                        <div className="truncate">
                          <span className="font-display text-xs font-bold sm:text-sm">
                            {l.nativeName}
                          </span>
                          <span className="ml-1.5 text-[10px] text-amber-700/80">({l.nameTr})</span>
                        </div>
                      </div>
                      {active && <span className="font-extrabold text-xs shrink-0">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 text-center border-t border-amber-200">
          <ToyButton tone="orange" size="sm" onClick={onClose}>
            Tamam / OK
          </ToyButton>
        </div>
      </div>
    </div>
  );
}
