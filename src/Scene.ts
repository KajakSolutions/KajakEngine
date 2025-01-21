import GameObject from "./objects/GameObject.ts";

export default class Scene {
    private _gameObjects: Map<number, GameObject> = new Map();

    get gameObjects(): Map<number, GameObject> {
        return this._gameObjects;
    }
}
