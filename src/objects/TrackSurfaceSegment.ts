import {Vec2D} from "../types/math";
import {add, multiply, normalize, subtract, vec2D} from "../utils/math"
import {PhysicObject, PolygonCollider} from "../index.ts";

export enum SurfaceType {
    ASPHALT = "ASPHALT",
    GRASS = "GRASS",
    GRAVEL = "GRAVEL",
    ICE = "ICE",
    MUD = "MUD"
}

export interface SurfaceProperties {
    gripMultiplier: number;
    dragMultiplier: number;
    color: string; // only for debug :D
}

export const SURFACE_PROPERTIES: Record<SurfaceType, SurfaceProperties> = {
    [SurfaceType.ASPHALT]: {
        gripMultiplier: 1.0,
        dragMultiplier: 1.0,
        color: "#404040"
    },
    [SurfaceType.GRASS]: {
        gripMultiplier: 0.7,
        dragMultiplier: 1.3,
        color: "#4CAF50"
    },
    [SurfaceType.GRAVEL]: {
        gripMultiplier: 0.8,
        dragMultiplier: 1.2,
        color: "#9E9E9E"
    },
    [SurfaceType.ICE]: {
        gripMultiplier: 0.3,
        dragMultiplier: 1.5,
        color: "#B3E5FC"
    },
    [SurfaceType.MUD]: {
        gripMultiplier: 0.5,
        dragMultiplier: 3,
        color: "#795548"
    }
};

export interface TrackSurfaceSegmentOptions {
    start: Vec2D;
    end: Vec2D;
    width: number;
    type: SurfaceType;
}

export class TrackSurfaceSegment extends PhysicObject {
    private readonly surfaceType: SurfaceType;
    private readonly width: number;
    private readonly start: Vec2D;
    private readonly end: Vec2D;

    constructor(options: TrackSurfaceSegmentOptions) {
        const direction = normalize(subtract(options.end, options.start));
        const perpendicular = vec2D(-direction.y, direction.x);
        const halfWidth = options.width / 2;
        const offsetVec = multiply(perpendicular, halfWidth);

        // Polygon collider for more complex shapes but i need only a very simple one. You can use this for more complex shapes or if you want better optimization choose line collider instead.
        const vertices = [
            add(options.start, offsetVec),
            add(options.end, offsetVec),
            subtract(options.end, offsetVec),
            subtract(options.start, offsetVec)
        ];

        const collider = new PolygonCollider(vec2D(0, 0), vertices);

        super({
            position: vec2D(0, 0),
            collider,
            movable: false,
            mass: 1000000
        });

        this.surfaceType = options.type;
        this.width = options.width;
        this.start = options.start;
        this.end = options.end;
    }

    getSurfaceProperties(): SurfaceProperties {
        return SURFACE_PROPERTIES[this.surfaceType];
    }

    getDebugInfo() {
        return {
            color: SURFACE_PROPERTIES[this.surfaceType].color,
            vertices: (this.collider as PolygonCollider).vertices,
            width: this.width,
            start: this.start,
            end: this.end
        };
    }

    override get aiDetectable(): boolean {
        return false;
    }
}
