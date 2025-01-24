import {Vec2D} from "../types/math";
import {vec2D} from "../utils/math.ts";
import Scene from "../Scene.ts";

export type SpriteOptions = {
    imageSrc: string;
    cellSize: Vec2D;
    columns: number;
    count: number;
};

export default class SpriteManager {
    private readonly _spriteSheet = new Image();
    private readonly _cellSize: Vec2D;
    private readonly _columns: number;
    private readonly _count: number;

    constructor(options: SpriteOptions) {
        this._spriteSheet.src = options.imageSrc;
        this._cellSize = options.cellSize;
        this._count = options.count;
        this._columns = options.columns;
    }

    drawSprite(ctx: CanvasRenderingContext2D, index: number, position: Vec2D, smoothing: boolean = false): void {
        ctx.save();

        ctx.imageSmoothingEnabled = smoothing;
        const spritePosition = this.getSpritePosition(index);

        ctx.translate(position.x, -position.y);
        ctx.drawImage(
            this._spriteSheet,
            spritePosition.x,
            spritePosition.y,
            this._cellSize.x,
            this._cellSize.y,
            -this._cellSize.x / Scene.scale,
            -this._cellSize.y / Scene.scale,
            Scene.scale / 2,
            Scene.scale / 2
        )

        ctx.restore();
    }

    getSpritePosition(index: number): Vec2D {
        return vec2D(
            (index % this._columns) * this._cellSize.x,
            Math.floor(index / this._columns) * this._cellSize.y
        )
    }

    getSprinteIndexByRotation(rotation: number, offset: number = 0): number {
        const normalizedAngle = ((rotation * (180 / Math.PI)) % 360 + 360) % 360;
        const step = 360 / this._count;
        return Math.floor(normalizedAngle / step + offset) % this._count;
    }

    get cellSize(): Vec2D {
        return this._cellSize;
    }

    get columns(): number {
        return this._columns;
    }

    get count(): number {
        return this._count;
    }
}
