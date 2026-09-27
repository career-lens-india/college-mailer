import { useEffect, useState } from "react";
import { DESKTOP_SPLIT_MEDIA_QUERY } from "./templateSwitch.ts";

export function useDesktopSplit(): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(DESKTOP_SPLIT_MEDIA_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_SPLIT_MEDIA_QUERY);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return matches;
}
