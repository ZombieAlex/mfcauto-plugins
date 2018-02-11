/// <reference types="node" />
import { EventEmitter } from "events";
export declare class Trending extends EventEmitter {
    private modelToRoomCounts;
    trendingThreshold: number;
    private intervalTimer;
    constructor(trendingThreshold?: number, checkInterval?: number);
    shutdown(): void;
    private modelUpdateCallback();
}
