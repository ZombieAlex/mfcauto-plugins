/*
Trending.ts detects when any model's viewer count increasing beyond a specified
threshold over a specified duration. It then emits "trendingModel" with the
Model instance whose room is trending, and the number of viewers the Model has
gained in the duration.
*/

import {EventEmitter} from "events";
import {Model, STATE} from "MFCAuto";

export class Trending extends EventEmitter {
    private modelToRoomCounts: Map<number, number>;
    public trendingThreshold: number;
    private intervalTimer: number;

    constructor(trendingThreshold = 60, checkInterval = 60 * 1000) {
        super();
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
