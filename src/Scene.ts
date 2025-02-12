import { QuadTree } from "./objects/QuadTree.ts"
import { BoundingBox } from "./types/math"
import PhysicObject from "./objects/PhysicObject.ts"
import CarObject from "./objects/CarObject.ts"
import { vec2D } from "./utils/math.ts"
import { AABBCollider } from "./objects/Colliders/AABBCollider.ts"
import PolygonCollider from "./objects/Colliders/PolygonCollider.ts"
import MapObject from "./objects/MapObject.ts"
import OverlapManager from "./objects/OverlapManager.ts"
import { RaceConfiguration, RaceManager } from "./objects/RaceManager.ts"
import CheckpointObject from "./objects/CheckpointObject.ts"
import { CarAIController } from "./objects/CarAI.ts"
import { LineCollider } from "./objects/Colliders/LineCollider.ts"

export default class Scene {
    private _gameObjects: Map<number, PhysicObject> = new Map()
    private _quadTree: QuadTree
    private nextId: number = 1
    private readonly _map: MapObject
    public readonly overlapManager = new OverlapManager()
    private readonly _raceManager: RaceManager
    static scale: number = 10
    private aiControllers: CarAIController[] = []
    private _debugMode: boolean = false

    constructor(
        worldBounds: BoundingBox,
        map: MapObject,
        raceManagerOptions?: RaceConfiguration
    ) {
        this._quadTree = new QuadTree(worldBounds)
        this._map = map
        this._raceManager = new RaceManager(raceManagerOptions)
    }

    get gameObjects(): Map<number, PhysicObject> {
        return this._gameObjects
    }

    get map(): MapObject {
        return this._map
    }

    get raceManager(): RaceManager {
        return this._raceManager
    }

    set debugMode(value: boolean) {
        this._debugMode = value
    }

    addAIController(controller: CarAIController) {
        this.aiControllers.push(controller)
    }

    addObject(object: PhysicObject): number {
        const id = this.nextId++
        this._gameObjects.set(id, object)
        object.id = id

        // Tylko  po to żeby nie trzeba było ręcznie dodawać samochodów i checkpointów do RaceManagera
        if (object instanceof CarObject) {
            this._raceManager.addCar(object)
        } else if (object instanceof CheckpointObject) {
            this._raceManager.addCheckpoint(object)
        }

        return id
    }

    removeObject(id: number): void {
        const object = this._gameObjects.get(id)
        if (!object) return

        const overlapsToRemove = Array.from(
            this.overlapManager.overlaps
        ).filter(
            (overlap) => overlap.obj1 === object || overlap.obj2 === object
        )

        overlapsToRemove.forEach((overlap) => {
            this.overlapManager.removeOverlap(overlap)
        })

        this._gameObjects.delete(id)
    }

    update(deltaTime: number): void {
        console.log(`FPS: ${Math.round(1 / deltaTime)}`)

        this.aiControllers.forEach((controller) => {
            const playerCar = Array.from(this._gameObjects.values()).find(
                (obj) => obj instanceof CarObject && obj.isPlayer
            ) as CarObject

            if (playerCar) {
                controller.update(this, playerCar)
            }
        })

        this._quadTree.clear()
        for (const obj of this._gameObjects.values()) {
            if (obj.collider) {
                this._quadTree.insert(obj)
            }
        }

        for (const obj of this._gameObjects.values()) {
            obj.collider.updatePosition(
                vec2D(obj.position.x, -obj.position.y),
                obj.rotation
            )
            obj.update(deltaTime)
        }

        this._raceManager.update()
        this.overlapManager.processOverlaps()
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

        ctx.save()
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2)
        ctx.scale(Scene.scale, Scene.scale)

        for (const obj of this._gameObjects.values()) {
            if (this._debugMode) {
                this.drawObject(ctx, obj)
            }

            if (!obj.spriteManager) continue

            const spriteIndex = obj.spriteManager.getSprinteIndexByRotation(
                obj.rotation
            )
            obj.spriteManager.drawSprite(ctx, spriteIndex, obj.position)
        }

        if (this._debugMode) {
            this.drawRays(ctx)
        }

        ctx.restore()
    }

    // @ts-ignore
    private drawRays(ctx: CanvasRenderingContext2D): void {
        this.aiControllers.forEach((controller) => {
            const ai = controller.getAI()
            const rays = ai.rays
            const results = ai.getRaycastResults(this)

            rays.forEach((ray, index) => {
                ctx.beginPath()
                ctx.strokeStyle =
                    results[index].distance < ai.rayLength ? "red" : "yellow"
                ctx.lineWidth = 0.1
                ctx.moveTo(ray.start.x, ray.start.y)
                ctx.lineTo(results[index].point.x, results[index].point.y)
                ctx.stroke()

                if (results[index].distance < ai.rayLength) {
                    ctx.beginPath()
                    ctx.fillStyle = "red"
                    ctx.arc(
                        results[index].point.x,
                        results[index].point.y,
                        0.3,
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()
                }
            })
        })
    }

    // @ts-ignore
    private drawObject(ctx: CanvasRenderingContext2D, obj: PhysicObject): void {
        if (obj instanceof CarObject) {
            ctx.save()
            ctx.translate(obj.position.x, -obj.position.y)
            ctx.rotate(obj.rotation)

            ctx.fillStyle = "blue"
            ctx.fillRect(
                -obj.size.x / 2,
                -obj.size.y / 2,
                obj.size.x,
                obj.size.y / 2
            )

            ctx.fillStyle = "black"
            ctx.fillRect(-obj.size.x / 2, 0, obj.size.x, obj.size.y / 2)

            ctx.fillStyle = "red"
            this.drawWheel(ctx, -obj.size.x / 2, obj.frontAxleToCg, 0, obj)
            this.drawWheel(ctx, obj.size.x / 2, obj.frontAxleToCg, 0, obj)
            this.drawWheel(
                ctx,
                -obj.size.x / 2,
                -obj.rearAxleToCg,
                obj.steerAngle,
                obj
            )
            this.drawWheel(
                ctx,
                obj.size.x / 2,
                -obj.rearAxleToCg,
                obj.steerAngle,
                obj
            )
            ctx.restore()
        }

        if (obj.collider) this.drawCollider(ctx, obj)
    }

    private drawWheel(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        angle: number,
        car: CarObject
    ): void {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillRect(
            -car.wheelSize.x / 2,
            -car.wheelSize.y / 2,
            car.wheelSize.x,
            car.wheelSize.y
        )
        ctx.restore()
    }

    private drawCollider(
        ctx: CanvasRenderingContext2D,
        obj: PhysicObject
    ): void {
        const bb = obj.collider.getBoundingBox()
        ctx.strokeStyle = "red"
        ctx.lineWidth = 0.1
        ctx.strokeRect(bb.x, bb.y, bb.width, bb.height)

        if (obj.collider instanceof PolygonCollider) {
            ctx.strokeStyle = "green"
            ctx.lineWidth = 0.05
            ctx.beginPath()
            for (let i = 0; i < obj.collider.vertices.length; i++) {
                const vertex = obj.collider.vertices[i]
                const x = vertex.x + obj.collider.position.x
                const y = vertex.y + obj.collider.position.y
                ctx.font = "0.8px serif"
                ctx.fillText(`(${x.toFixed(2)}, ${y.toFixed(2)})`, x, y)
                ctx.lineTo(x, y)
            }

            ctx.closePath()
            ctx.stroke()
        } else if (obj.collider instanceof AABBCollider) {
            ctx.strokeStyle = "green"
            ctx.lineWidth = 0.05
            ctx.strokeRect(
                obj.collider.position.x,
                obj.collider.position.y,
                obj.collider.size.x,
                obj.collider.size.y
            )
        } else if (obj.collider instanceof LineCollider) {
            ctx.strokeStyle = "green"
            ctx.lineWidth = 0.05
            ctx.beginPath()
            ctx.moveTo(obj.collider.start.x, obj.collider.start.y)
            ctx.lineTo(obj.collider.end.x, obj.collider.end.y)
            ctx.stroke()
        }
    }
}
