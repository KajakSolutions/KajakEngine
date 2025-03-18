export type MapOptions = {
    backgroundSrc: string
    secondBackgroundSrc?: string
}

export default class MapObject {
    private readonly _backgroundSrc: string
    private readonly _secondBackgroundSrc?: string

    constructor(options: MapOptions) {
        this._backgroundSrc = options.backgroundSrc
        this._secondBackgroundSrc = options.secondBackgroundSrc
    }

    get backgroundSrc(): string {
        return this._backgroundSrc
    }
    get secondBackgroundSrc(): string | undefined{
        return this._secondBackgroundSrc
    }
}
