import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import { MAP_LABEL_HIDDEN_STATE, MAP_LAYER_SOURCE_ID } from "@/constants/map";

/**
 * Hides the symbol-layer label of `townId` (via feature-state opacity) so it does not
 * duplicate the HTML label of the focused marker. Pass `null` to hide nothing.
 */
export function useHiddenTownLabel(townId: string | null): void {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map || !townId) return;
    const target = { source: MAP_LAYER_SOURCE_ID, id: townId };
    const hide = () => {
      if (!map.getSource(MAP_LAYER_SOURCE_ID)) return;
      map.setFeatureState(target, { [MAP_LABEL_HIDDEN_STATE]: true });
    };

    hide();
    // Feature-state is dropped when the basemap style swaps and the source is re-added.
    map.on("styledata", hide);
    return () => {
      map.off("styledata", hide);
      if (!map.getSource(MAP_LAYER_SOURCE_ID)) return;
      map.removeFeatureState(target, MAP_LABEL_HIDDEN_STATE);
    };
  }, [map, townId]);
}
