import Overlap from "./Overlap.ts"

export default class OverlapManager {
    private _overlaps: Overlap[] = []

    get overlaps(): Overlap[] {
        return this._overlaps
    }

    addOverlap(overlap: Overlap): void {
        this._overlaps.push(overlap)
    }

    removeOverlap(overlap: Overlap): void {
        const index = this._overlaps.indexOf(overlap)
        if (index !== -1) {
            this._overlaps.splice(index, 1)
        }
    }

    processOverlaps(): void {
        this._overlaps.forEach((overlap) => {
            if (overlap.isHappening()) {
                overlap.onOverlap()
            }
        })
    }
}
