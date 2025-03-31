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
import {SurfaceType} from "./objects/TrackSurfaceSegment.ts";
import {TrackSurfaceManager} from "./objects/TrackSurfaceManager.ts";
import MovingBarrier from "./objects/MovingBarrier.ts";
import {WeatherSystem, WeatherType} from "./objects/WeatherSystem.ts";
import { NitroManager } from "./objects/NitroManager.ts"


interface MapConfig {
    name: string;
    backgroundSrc: string;
    secondBackgroundSrc?: string;
    worldBounds: BoundingBox;
    checkpoints: CheckpointConfig[];
    barriers: BarrierConfig;
    aiCars: AiCarConfig[];
    obstacles: ObstacleConfig[];
    startPosition: Vec2D;
    startRotation?: number;
    playerCarConfig: PlayerCarConfig;
    surfaces: SurfaceConfig;
    movingBarriers?: MovingBarrierConfig[];
    weather?: WeatherConfig;
    nitroSpawns?: NitroSpawnConfig[];
}

interface NitroSpawnConfig {
    position: Vec2D;
    respawnTime?: number;
    size?: Vec2D;
    spriteSrc?: string;
}

interface WeatherConfig {
    initialWeather?: WeatherType;
    minDuration?: number;
    maxDuration?: number;
    intensity?: number;
    puddleSpawnPoints?: Array<{
        position: Vec2D;
        size: Vec2D;
        type?: 'puddle' | 'ice';
    }>;
    allowedWeatherTypes?: WeatherType[];
}

interface SurfaceConfig {
    segments: Array<{
        start: Vec2D;
        end: Vec2D;
        width: number;
        type: SurfaceType;
    }>;
}

interface MovingBarrierConfig {
    position: Vec2D;
    size: Vec2D;
    movementTime?: number;
    closedWaitTime?: number;
    openWaitTime?: number;
    movementDistance?: number;
    direction?: number;
    spriteSrc: string;
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
                imageSrc: "game/checkpoint.png",
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
        carId: number,
        surfaceManager: TrackSurfaceManager,
        rotation: number = 0
    ): CarObject {
        return new CarObject({
            position,
            size,
            movable: true,
            collider: this.createCarCollider(),
            mass: 900,
            maxGrip: 10,
            wheelBase: 4.5,
            drag: 25,
            rotation,
            spriteManager: new SpriteManager({
                imageSrc: spriteSrc,
                cellSize: vec2D(32, 32),
                count: 48,
                columns: 7,
                offset: 36,
            }),
            isPlayer,
            id: carId,
            surfaceManager,
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
            new MapObject({
                backgroundSrc: config.backgroundSrc ,
                secondBackgroundSrc: config.secondBackgroundSrc,
                worldBounds: config.worldBounds
            })
        );

        const surfaceManager = new TrackSurfaceManager();

        let weatherConfig: WeatherConfig = {
            initialWeather: WeatherType.CLEAR,
            minDuration: 30000,
            maxDuration: 120000,
            intensity: 0.8,
            puddleSpawnPoints: [],
            allowedWeatherTypes: [WeatherType.CLEAR, WeatherType.RAIN, WeatherType.SNOW]
        };

        if (config.weather) {
            let initialWeather;
            if (config.weather.initialWeather) {
                initialWeather = WeatherType[config.weather.initialWeather as keyof typeof WeatherType];
            }

            weatherConfig = {
                ...weatherConfig,
                initialWeather: initialWeather || weatherConfig.initialWeather,
                minDuration: config.weather.minDuration || weatherConfig.minDuration,
                maxDuration: config.weather.maxDuration || weatherConfig.maxDuration,
                intensity: config.weather.intensity || weatherConfig.intensity,
                puddleSpawnPoints: config.weather.puddleSpawnPoints || weatherConfig.puddleSpawnPoints,
                allowedWeatherTypes: config.weather.allowedWeatherTypes || weatherConfig.allowedWeatherTypes
            };
        }

        const weatherSystem = new WeatherSystem(scene, weatherConfig);
        scene.setWeatherSystem(weatherSystem);


        if (config.surfaces) {
            config.surfaces.segments.forEach(segment => {
                surfaceManager.addSegment({
                    start: segment.start,
                    end: segment.end,
                    width: segment.width,
                    type: segment.type
                });
            });
            surfaceManager.addToScene(scene);
        }

        if (config.movingBarriers) {
            config.movingBarriers.forEach(barrierConfig => {
                const barrier = new MovingBarrier({
                    position: barrierConfig.position,
                    size: barrierConfig.size,
                    movementTime: barrierConfig.movementTime,
                    closedWaitTime: barrierConfig.closedWaitTime,
                    openWaitTime: barrierConfig.openWaitTime,
                    movementDistance: barrierConfig.movementDistance,
                    direction: barrierConfig.direction,
                    spriteManager: new SpriteManager({
                        imageSrc: barrierConfig.spriteSrc,
                        cellSize: vec2D(149, 10),
                        count: 1,
                        columns: 1
                    }),
                    mass: 100000
                });
                scene.addObject(barrier);
            });
        }

        config.checkpoints.forEach(checkpointConfig => {
            const checkpoint = this.createCheckpoint(checkpointConfig);
            scene.addObject(checkpoint);
        });

        const trackBarriers = new TrackBarriers(config.barriers);
        trackBarriers.addToScene(scene);

        let nextCarId = 0;
        const startRotation = config.startRotation ? degreesToRadians(config.startRotation) : 0;

        const playerCar = this.createCar(
            config.startPosition,
            config.playerCarConfig.spriteSrc,
            config.playerCarConfig.size,
            true,
            nextCarId++,
            surfaceManager,
            startRotation
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
                nextCarId++,
                surfaceManager,
                startRotation
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

        if (config.nitroSpawns) {
            const nitroManager = new NitroManager(scene);
            nitroManager.initialize(config.nitroSpawns || []);
        }

        return scene;
    }
}
