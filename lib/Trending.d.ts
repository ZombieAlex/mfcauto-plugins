/// <reference types="node" />
export declare class Trending extends NodeJS.EventEmitter {
    private modelToRoomCounts;
    trendingThreshold: number;
    private intervalTimer;
    constructor(trendingThreshold?: number, checkInterval?: number);
    shutdown(): void;
    private modelUpdateCallback();
}
