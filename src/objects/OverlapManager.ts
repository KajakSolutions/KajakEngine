import Overlap from "./Overlap.ts";

export default class OverlapManager {
    private overlaps: Overlap[] = [];

    addOverlap(overlap: Overlap): void {
        this.overlaps.push(overlap);
    }

    removeOverlap(overlap: Overlap): void {
        const index = this.overlaps.indexOf(overlap);
        if (index !== -1) {
            this.overlaps.splice(index, 1);
        }
    }

    processOverlaps(): void {
        this.overlaps.forEach(overlap => {
            if (overlap.isHappening()) {
                overlap.onOverlap();
            }
        });
    }
}
