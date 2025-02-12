export type MapOptions = {
    backgroundSrc: string
}

export default class MapObject {
    private readonly _backgroundSrc: string

    constructor(options: MapOptions) {
        this._backgroundSrc = options.backgroundSrc
    }

    get backgroundSrc(): string {
        return this._backgroundSrc
    }
}
