import Scene from "./Scene.ts";

export default class KajakEnginge {
    private _scenes: Map<number, Scene> = new Map();

    get scenes(): Map<number, Scene> {
        return this._scenes;
    }
}
