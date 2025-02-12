import {BoundingBox, Vec2D} from "./types/math";
import {AIBehaviorType, CarAIController} from "./objects/CarAI.ts";
import {
    AABBCollider,
    CarObject,
    CheckpointObject,
    degreesToRadians, MapObject,
    PolygonCollider,
    SpriteManager, TrackBarriers, TreeObject,
    vec2D
} from "./index.ts";
import Scene from "./Scene.ts";


interface MapConfig {
    name: string;
    backgroundSrc: string;
    worldBounds: BoundingBox;
    checkpoints: CheckpointConfig[];
    barriers: BarrierConfig;
    aiCars: AiCarConfig[];
    obstacles: ObstacleConfig[];
    startPosition: Vec2D;
    playerCarConfig: PlayerCarConfig;
}

interface CheckpointColliderConfig {
    type: "AABB";
    offset: Vec2D;
    size: Vec2D;
}

interface CheckpointConfig {
    position: Vec2D;
    size: Vec2D;
    rotation: number;
    order: number;
    isFinishLine: boolean;
    collider: CheckpointColliderConfig;
}

interface BarrierConfig {
    thickness: number;
    segments: Array<{
        start: Vec2D;
        end: Vec2D;
    }>;
}

interface AiCarConfig {
    type: keyof typeof AIBehaviorType;
    spriteSrc: string;
    startOffset: Vec2D;
}

interface ObstacleConfig {
    position: Vec2D;
    size: Vec2D;
    vertices: Vec2D[];
    spriteSrc: string;
}

interface PlayerCarConfig {
    spriteSrc: string;
    size: Vec2D;
}

export class MapLoader {
    private static createCheckpoint(config: CheckpointConfig): CheckpointObject {
        const collider = new AABBCollider(
            vec2D(config.collider.offset.x, config.collider.offset.y),
            vec2D(config.collider.size.x, config.collider.size.y)
        );

        return new CheckpointObject({
            position: config.position,
            size: config.size,
            order: config.order,
            isFinishLine: config.isFinishLine,
            movable: false,
            rotation: degreesToRadians(config.rotation),
            collider: collider,
            spriteManager: new SpriteManager({
                imageSrc: "src/assets/checkpoint.png",
                cellSize: vec2D(32, 32),
                count: 48,
                columns: 7,
                offset: 47,
            }),
            mass: 1,
        });
    }

    private static createCarCollider(): PolygonCollider {
        return new PolygonCollider(vec2D(0, 0), [
            vec2D(-0.75, -1.5),
            vec2D(0.75, -1.5),
            vec2D(0.75, 1.5),
            vec2D(-0.75, 1.5),
        ]);
    }

    private static createCar(
        position: Vec2D,
        spriteSrc: string,
        size: Vec2D,
        isPlayer: boolean = false,
        carId: number
    ): CarObject {
        return new CarObject({
            position,
            size,
            movable: true,
            collider: this.createCarCollider(),
            mass: 1000,
            maxGrip: 12,
            wheelBase: 2.4,
            spriteManager: new SpriteManager({
                imageSrc: spriteSrc,
                cellSize: vec2D(32, 32),
                count: 48,
                columns: 7,
                offset: 36,
            }),
            isPlayer,
            id: carId,
        });
    }

    private static createObstacle(config: ObstacleConfig): TreeObject {
        return new TreeObject({
            position: config.position,
            size: config.size,
            movable: false,
            collider: new PolygonCollider(vec2D(0, 0), config.vertices),
            mass: 1500,
            spriteManager: new SpriteManager({
                imageSrc: config.spriteSrc,
                cellSize: vec2D(32, 32),
                count: 48,
                columns: 7,
            }),
        });
    }

    static async loadMap(jsonPath: string): Promise<Scene> {
        console.log("Loading map:", jsonPath);
        const response = await fetch(jsonPath);
        const config: MapConfig = await response.json();

        const scene = new Scene(
            config.worldBounds,
            new MapObject({ backgroundSrc: config.backgroundSrc })
        );

        config.checkpoints.forEach(checkpointConfig => {
            const checkpoint = this.createCheckpoint(checkpointConfig);
            scene.addObject(checkpoint);
        });

        const trackBarriers = new TrackBarriers(config.barriers);
        trackBarriers.addToScene(scene);

        let nextCarId = 0;
        const playerCar = this.createCar(
            config.startPosition,
            config.playerCarConfig.spriteSrc,
            config.playerCarConfig.size,
            true,
            nextCarId++
        );
        scene.addObject(playerCar);

        config.aiCars.forEach(aiConfig => {
            const position = vec2D(
                config.startPosition.x + aiConfig.startOffset.x,
                config.startPosition.y + aiConfig.startOffset.y
            );

            const aiCar = this.createCar(
                position,
                aiConfig.spriteSrc,
                config.playerCarConfig.size,
                false,
                nextCarId++
            );

            const aiController = new CarAIController(
                aiCar,
                AIBehaviorType[aiConfig.type]
            );

            scene.addObject(aiCar);
            scene.addAIController(aiController);
        });

        config.obstacles.forEach(obstacleConfig => {
            const obstacle = this.createObstacle(obstacleConfig);
            scene.addObject(obstacle);
        });

        return scene;
    }
}
