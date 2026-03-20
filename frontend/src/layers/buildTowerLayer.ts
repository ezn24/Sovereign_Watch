import { ScatterplotLayer } from '@deck.gl/layers';

export const buildTowerLayer = (towers: any[], visible: boolean) => {
    if (!visible || !towers || towers.length === 0) return null;

    return new ScatterplotLayer({
        id: 'tower-layer',
        data: towers,
        pickable: true,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 3,
        radiusMaxPixels: 10,
        lineWidthMinPixels: 1,
        getPosition: (d: any) => d.coordinates,
        getFillColor: [255, 140, 0, 180], // Orange
        getLineColor: [255, 255, 255, 100],
        onHover: () => {
            // Optional tooltip handling
        }
    });
};
