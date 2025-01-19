import GameObject from "./objects/GameObject.ts";
import Overlap from "./behavior/IOverlap.ts";

export default class Scene {
    private _gameObjects: Map<number, GameObject> = new Map();
    private _overlaps: Map<number, Overlap> = new Map();

    get gameObjects(): Map<number, GameObject> {
        return this._gameObjects;
    }

    get overlaps(): Map<number, Overlap> {
        return this._overlaps;
    }
}
