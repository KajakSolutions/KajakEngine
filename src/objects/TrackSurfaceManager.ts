import {
    SURFACE_PROPERTIES,
    SurfaceProperties,
    SurfaceType,
    TrackSurfaceSegment,
    TrackSurfaceSegmentOptions
} from "./TrackSurfaceSegment.ts";
import {Vec2D} from "../types/math";

export class TrackSurfaceManager {
    private segments: TrackSurfaceSegment[] = [];

    addSegment(options: TrackSurfaceSegmentOptions): void {
        const segment = new TrackSurfaceSegment(options);
        this.segments.push(segment);
    }

    getSurfacePropertiesAt(position: Vec2D): SurfaceProperties {
        let currentSurface = SURFACE_PROPERTIES[SurfaceType.ASPHALT];

        for (const segment of this.segments) {
            if (segment.collider.containsPoint(position)) {
                currentSurface = segment.getSurfaceProperties();
                break;
            }
        }

        return currentSurface;
    }

    getSegments(): TrackSurfaceSegment[] {
        return this.segments;
    }

    addToScene(scene: any): void {
        this.segments.forEach(segment => {
            scene.addObject(segment);
        });
    }
}
