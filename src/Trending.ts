/*
Trending.ts detects when any model's viewer count increasing beyond a specified
threshold over a specified duration. It then emits "trendingModel" with the
Model instance whose room is trending, and the number of viewers the Model has
gained in the duration.
*/

import {EventEmitter} from "events";
import {Model, STATE, applyMixins} from "MFCAuto";

export class Trending implements NodeJS.EventEmitter {
    private modelToRoomCounts: Map<number, number>;
    public trendingThreshold: number;
    private intervalTimer: number;

    // Instance EventEmitter methods
    public addListener: (event: string, listener: Function) => this;
    public on: (event: string, listener: Function) => this;
    public once: (event: string, listener: Function) => this;
    public prependListener: (event: string, listener: Function) => this;
    public prependOnceListener: (event: string, listener: Function) => this;
    public removeListener: (event: string, listener: Function) => this;
    public removeAllListeners: (event?: string) => this;
    public getMaxListeners: () => number;
    public setMaxListeners: (n: number) => this;
    public listeners: (event: string) => Function[];
    public emit: (event: string, ...args: any[]) => boolean;
    public eventNames: () => string[];
    public listenerCount: (type: string) => number;

    constructor(trendingThreshold = 60, checkInterval = 60 * 1000) {
        this.trendingThreshold = trendingThreshold;
        this.modelToRoomCounts = new Map();
        this.intervalTimer = setInterval(this.modelUpdateCallback.bind(this), checkInterval);
    }

    public shutdown() {
        clearInterval(this.intervalTimer);
        this.modelToRoomCounts.clear();
    }

    private modelUpdateCallback() {
        Model.findModels((m) => true).forEach((m) => {
            if (m.bestSession.vs === STATE.Offline) {
                this.modelToRoomCounts.delete(m.uid);
            } else if (typeof m.bestSession.rc === "number") {
                let currentCount = m.bestSession.rc as number;
                if (this.modelToRoomCounts.has(m.uid)) {
                    let previousCount = this.modelToRoomCounts.get(m.uid) as number;
                    let delta = currentCount - previousCount;
                    if (delta >= this.trendingThreshold) {
                        this.emit("trendingModel", m, delta);
                    }
                }
                this.modelToRoomCounts.set(m.uid, currentCount);
            }
        });
    }
}

applyMixins(Trending, [EventEmitter]);
