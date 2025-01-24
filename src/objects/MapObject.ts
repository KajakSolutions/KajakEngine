import CheckpointObject from "./CheckpointObject.ts";

export type MapOptions = {
    backgroundSrc: string;
    traceFragments: [];
}

export default class MapObject {
    private _backgroundSrc: string;
    private _traceFragments: [];
    private _checkpoints: CheckpointObject [];


    constructor(options: MapOptions) {
        this._backgroundSrc = options.backgroundSrc;
        this._traceFragments = options.traceFragments;
    }

    get backgroundSrc(): string {
        return this._backgroundSrc;
    }

    get traceFragments(): [] {
        return this._traceFragments;
    }
}
