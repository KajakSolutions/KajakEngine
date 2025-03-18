import {
    KajakEngine,
    Scene,
    CarObject,
    Overlap, CheckpointObject,
} from "./index";
import {MapLoader} from "./MapLoader.ts";

class Game {
    private engine: KajakEngine;
    private currentScene: Scene | null = null;
    private debugState: boolean = false;

    constructor() {
        const canvas = document.createElement("canvas");
        document.querySelector('#app')!.appendChild(canvas);
        this.engine = new KajakEngine(canvas);

        this.setupUI();
        this.setupEventListeners();
    }

    private setupUI(): void {
        const leaderboardContainer = document.createElement("div");
        leaderboardContainer.id = "leaderboard-container";
        document.body.appendChild(leaderboardContainer);

        const debugSwitch = document.createElement("button");
        debugSwitch.innerText = "Debug Switch";
        debugSwitch.id = "debug-switch";
        document.body.appendChild(debugSwitch);

        debugSwitch.onclick = () => {
            this.debugState = !this.debugState;
            this.engine.setDebugMode(this.debugState);
        };
    }

    private setupEventListeners(): void {
        document.addEventListener("keydown", this.handleKeyDown.bind(this));
        document.addEventListener("keyup", this.handleKeyUp.bind(this));
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (!this.currentScene) return;

        const playerCar = this.findPlayerCar();
        if (!playerCar) return;

        switch (e.key) {
            case "ArrowUp":
                playerCar.setThrottle(183.91);
                break;
            case "ArrowDown":
                playerCar.setThrottle(-30);
                break;
            case "ArrowLeft":
                playerCar.setSteerAngle(-Math.PI / 2);
                break;
            case "ArrowRight":
                playerCar.setSteerAngle(Math.PI / 2);
                break;
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        if (!this.currentScene) return;

        const playerCar = this.findPlayerCar();
        if (!playerCar) return;

        switch (e.key) {
            case "ArrowUp":
            case "ArrowDown":
                playerCar.setThrottle(0);
                break;
            case "ArrowLeft":
            case "ArrowRight":
                playerCar.setSteerAngle(0);
                break;
        }
    }

    private findPlayerCar(): CarObject | null {
        if (!this.currentScene) return null;

        for (const obj of this.currentScene.gameObjects.values()) {
            if (obj instanceof CarObject && obj.isPlayer) {
                return obj;
            }
        }
        return null;
    }

    private setupCollisions(scene: Scene): void {
        const cars = Array.from(scene.gameObjects.values())
            .filter(obj => obj instanceof CarObject) as CarObject[];

        const checkpoints = Array.from(scene.gameObjects.values())
            .filter(obj => obj instanceof CheckpointObject) as CheckpointObject[];

        const barriers = Array.from(scene.gameObjects.values())
            .filter(obj => !(obj instanceof CarObject) && !(obj instanceof CheckpointObject));

        // Car-to-car collisions
        for (let i = 0; i < cars.length; i++) {
            for (let j = i + 1; j < cars.length; j++) {
                const overlap = new Overlap(
                    cars[i],
                    cars[j],
                    (car1, car2, collisionInfo) => {
                        if (collisionInfo) {
                            car1.onCollision(car2, collisionInfo);
                        }
                    },
                    { customCollisionHandler: true }
                );
                scene.overlapManager.addOverlap(overlap);
            }
        }

        // Car-to-checkpoint collisions
        for (const car of cars) {
            for (const checkpoint of checkpoints) {
                const overlap = new Overlap(
                    car,
                    checkpoint,
                    (vehicle, checkpointObj) => {
                        if (checkpointObj instanceof CheckpointObject) {
                            if (vehicle instanceof CarObject && vehicle.isPlayer && checkpointObj.isActivated) {
                                checkpointObj.activate(vehicle);
                                checkpointObj.spriteManager!.hidden = true;
                            }
                        }
                    }
                );
                scene.overlapManager.addOverlap(overlap);
            }
        }

        // Car-to-barrier collisions
        for (const car of cars) {
            for (const barrier of barriers) {
                const overlap = new Overlap(
                    car,
                    barrier,
                    (vehicle, staticObj, collisionInfo) => {
                        if (collisionInfo) {
                            vehicle.onCollision(staticObj, collisionInfo);
                        }
                    },
                    { customCollisionHandler: true }
                );
                scene.overlapManager.addOverlap(overlap);
            }
        }
    }

    public async loadMap(mapPath: string): Promise<void> {
        try {
            this.currentScene = await MapLoader.loadMap(mapPath);
            this.engine.scenes.set(1, this.currentScene);
            this.engine.setCurrentScene(1);

            if (this.currentScene) {
                this.setupCollisions(this.currentScene);
            }
        } catch (error) {
            console.error("Error loading map:", error);
            throw error;
        }
    }

    public start(): void {
        this.engine.start();
    }
}

async function initGame() {
    const game = new Game();
    await game.loadMap("src/assets/race-track01.json");
    game.start();
}

initGame().catch(error => {
    console.error("Failed to initialize game:", error);
});
