import {BoundingBox} from "../types/math";

export type MapOptions = {
    backgroundSrc: string
    secondBackgroundSrc?: string
    worldBounds: BoundingBox
}

export default class MapObject {
    private readonly _backgroundSrc: string
    private readonly _secondBackgroundSrc?: string
    private readonly _worldBounds: BoundingBox

    constructor(options: MapOptions) {
        this._backgroundSrc = options.backgroundSrc
        this._secondBackgroundSrc = options.secondBackgroundSrc
        this._worldBounds = options.worldBounds
    }

    get worldBounds(): BoundingBox {
        return this._worldBounds
    }

    get backgroundSrc(): string {
        return this._backgroundSrc
    }

    get secondBackgroundSrc(): string | undefined{
        return this._secondBackgroundSrc
    }
}
