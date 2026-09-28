// src/components/CategorySheet.tsx
import React, { useEffect } from "react";
import { X } from "lucide-react";
import { CATEGORIES, getCategoryLabel } from "../data/categories";
import type { CategoryId, Category } from "../data/categories";

type CategorySheetProps = {
  open: boolean;
  isPT: boolean;
  selectedCategory: CategoryId;
  onSelect: (id: CategoryId) => void;
  onClose: () => void;
};

const CategorySheet: React.FC<CategorySheetProps> = ({
  open,
  isPT,
  selectedCategory,
  onSelect,
  onClose,
}) => {
  /* ESC + scroll lock */
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  /* Todas as categorias exceto "all" (que já está implícita em "Todas") */
  const items: Category[] = CATEGORIES.filter((c) => c.id !== "all");

  return (
    <div
      className="fixed inset-0 z-50 sm:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-sheet-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-slate-900/50 backdrop-blur-sm"
        aria-label={isPT ? "Fechar" : "Close"}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2
              id="category-sheet-title"
              className="text-base font-semibold text-slate-900"
            >
              {isPT ? "Todas as categorias" : "All categories"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {isPT
                ? `${items.length} categorias disponíveis`
                : `${items.length} categories available`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            aria-label={isPT ? "Fechar" : "Close"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grid 2 colunas — Weinschenk: mais itens por linha, leitura rápida */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            {/* "Todas" — reset */}
            <button
              type="button"
              onClick={() => {
                onSelect("all");
                onClose();
              }}
              className={[
                "flex items-center gap-2.5 p-3 rounded-2xl border transition text-left",
                selectedCategory === "all"
                  ? "border-[#1F6FA6] bg-sky-50 text-[#1F6FA6]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <span className="text-xl">🏖️</span>
              <span className="text-xs font-semibold truncate">
                {isPT ? "Todas" : "All"}
              </span>
            </button>

            {items.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelect(cat.id);
                    onClose();
                  }}
                  className={[
                    "flex items-center gap-2.5 p-3 rounded-2xl border transition text-left",
                    active
                      ? "border-[#1F6FA6] bg-sky-50 text-[#1F6FA6]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span className="text-xl shrink-0">{cat.icon}</span>
                  <span className="text-xs font-semibold leading-tight line-clamp-2">
                    {getCategoryLabel(cat.id, isPT)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySheet;
