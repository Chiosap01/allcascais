// src/components/ScrollToTop.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Krug: "Where am I?" — o utilizador tem de chegar sempre ao início
 * da nova página, senão perde-se e pensa que a app está partida.
 *
 * Comportamento:
 * - Navegação normal (mudança de path): scroll para o topo
 * - Navegação com hash (#section-3): scroll para o elemento
 * - Botão "voltar" do browser: preserva posição (popstate)
 */
const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Se houver hash (#section-x), scroll para esse elemento
    if (hash) {
      // Pequeno delay para o conteúdo renderizar antes de fazer scroll
      const t = setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      }, 50);
      return () => clearTimeout(t);
    }

    // Caso normal: scroll para o topo, sem animação (instantâneo)
    // "auto" em vez de "smooth" porque numa mudança de página
    // uma animação longa faz o utilizador pensar que não aconteceu nada.
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
