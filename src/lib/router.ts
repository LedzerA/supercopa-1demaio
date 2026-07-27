import { useEffect, useState } from "react";

/** Router de hash minúsculo — sem react-router, como no statsproleta. */
export function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const aoMudar = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);
  return hash;
}

export function irPara(rota: string) {
  window.location.hash = rota;
}

/** "#/regionais/r-lapa" -> ["regionais", "r-lapa"] */
export function partes(hash: string): string[] {
  return hash.replace(/^#\/?/, "").split("/").filter(Boolean);
}
