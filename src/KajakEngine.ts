import Scene from "./Scene.ts";

export default class KajakEngine {
    private _scenes: Map<number, Scene> = new Map();
    private _currentScene: Scene | null = null;
    private readonly _ctx: CanvasRenderingContext2D;
    private readonly _canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        const ctx = this._canvas.getContext("2d");
        if (!ctx) throw new Error("Unable to get 2d context from canvas");
        this._ctx = ctx;
    }

    get currentScene(): Scene | null {
        return this._currentScene;
    }

    get ctx(): CanvasRenderingContext2D {
        return this._ctx;
    }

    get scenes(): Map<number, Scene> {
        return this._scenes;
    }

    update(): void {

    }
}
