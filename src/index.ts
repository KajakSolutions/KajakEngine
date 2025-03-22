// Core Engine
export { default as KajakEngine } from "./KajakEngine"
export { default as Scene } from "./Scene"
export {  MapLoader } from "./MapLoader"
export {  QuadTree } from "./objects/QuadTree"

// Game Objects
export { default as GameObject } from "./objects/GameObject"
export { default as PhysicObject } from "./objects/PhysicObject"
export { default as CarObject } from "./objects/CarObject"
export { default as CheckpointObject } from "./objects/CheckpointObject"
export { default as TreeObject } from "./objects/TreeObject"
export { default as MapObject } from "./objects/MapObject"
export { default as SpriteManager } from "./objects/SpriteManager"
export { default as NitroBonus } from "./objects/NitroBonus"

// Colliders
export { default as Collider } from "./objects/Colliders/Collider"
export { AABBCollider } from "./objects/Colliders/AABBCollider"
export { LineCollider } from "./objects/Colliders/LineCollider"
export { default as PolygonCollider } from "./objects/Colliders/PolygonCollider"

// AI and Race Management
export { CarAI, CarAIController, AIBehaviorType } from "./objects/CarAI"
export { RaceManager } from "./objects/RaceManager"
export { SoundManager } from "./SoundManager"

// Barrier System
export { TrackBarriers, BarrierSegment } from "./objects/BarierSystem"

// Overlap System
export { default as Overlap } from "./objects/Overlap"
export { default as OverlapManager } from "./objects/OverlapManager"

// Types
export type { Vec2D, BoundingBox } from "./types/math"
export type { GameObjectOptions } from "./objects/GameObject"
export type { PhysicObjectOptions } from "./objects/PhysicObject"
export type { CarObjectOptions } from "./objects/CarObject"
export type { CheckpointObjectOptions } from "./objects/CheckpointObject"
export type { MapOptions } from "./objects/MapObject"
export type { SpriteOptions } from "./objects/SpriteManager"
export type { RaceResults, RaceConfiguration } from "./objects/RaceManager"
export type {
    BarrierSegmentOptions,
    TrackBarriersOptions,
} from "./objects/BarierSystem"

// Utils
export * from "./utils/math"
