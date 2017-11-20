/*
Trending2.ts is like Trending.ts but instead of polling every
X milliseconds, it keeps a history of room counts and detects
the instant that a model's room count exceeds the threshold.
This has two main benefits:
    1. Detecting trending rooms earlier
    2. The flexibility to listen for different thresholds
        with a single Trending2 object, and to even change
        the time intervals or thresholds with creating
        a new instance.
A downside is that Trending2 takes considerably more memory
and has some processing overhead.

Trending2 is not an EventEmitter. You hook up callbacks for
specific thresholds by using .onTrendingThresholds
*/

import {EventEmitter} from "events";
import {Model, STATE} from "MFCAuto";
import {setTimeout} from "timers";

interface HistoricalCount {
    time: number;
    count: number;
}

export type Trending2Callback = (model: Model, duration: number, delta: number) => void;

export class Trending2 {
    private trendingCallbacks: Map<number, Map<number, Trending2Callback>>;
    private offlineTimerMap: Map<number, NodeJS.Timer>;

    // Maximum history (in minutes) of room count
    // updates to keep for each model
    private maxHistoryMilliseconds: number;

    // Map of model ID to a queue of their room
    // counts going back maxHistoryMinutes or
    private modelToCountHistories: Map<number, Array<HistoricalCount>>;

    constructor(maxHistoryMilliseconds: number = 30 * 60 * 1000) {
        this.offlineTimerMap = new Map();
        this.modelToCountHistories = new Map();
        this.trendingCallbacks = new Map();
        this.reset(maxHistoryMilliseconds);
        Model.on("vs", this.vsHandler.bind(this));
        Model.on("rc", this.rcHandler.bind(this));
    }

    // Clears all registered callbacks and optionally alters the
    // maximum kept room count history. The latter applies going
    // forward only. Older history is already lost.
    public reset(maxHistoryMilliseconds: number = this.maxHistoryMilliseconds) {
        this.maxHistoryMilliseconds = maxHistoryMilliseconds;
        this.trendingCallbacks.clear();
    }

    // Resets this instance, kills all outstanding timers,
    // and clears historical room counts. This is useful
    // for when the consumer is shutting down and wants
    // the NodeJS event loop to die immediately.
    public shutdown() {
        this.reset();
        this.offlineTimerMap.forEach((timer, uid) => {
            clearTimeout(timer);
        });
        this.offlineTimerMap.clear();
        this.modelToCountHistories.clear();
    }

    public onTrendingThresholds(milliseconds: number, viewerCount: number, callback: Trending2Callback): void {
        if (milliseconds > this.maxHistoryMilliseconds) {
            this.maxHistoryMilliseconds = milliseconds;
        }
        if (!this.trendingCallbacks.has(milliseconds)) {
            this.trendingCallbacks.set(milliseconds, new Map());
        }
        (this.trendingCallbacks.get(milliseconds) as Map<number, Trending2Callback>).set(viewerCount, callback);
        this.checkAllModels();
    }

    private vsHandler(model: Model, before: STATE, after: STATE): void {
        if (after === STATE.Offline) {
            // If she's still offline 120 seconds later,
            // dump her room history and save memory.
            // The 120 second mercy period is to guard
            // against a model who just goes offline for
            // a brief moment and comes right back to
            // a room with several hundred guys. That
            // should not be detected as "trending".
            this.offlineTimerMap.set(model.uid, setTimeout(() => {
                if (model.bestSession.vs === STATE.Offline) {
                    this.modelToCountHistories.delete(model.uid);
                }
                this.offlineTimerMap.delete(model.uid);
            }, 120 * 1000));
        }
    }

    private rcHandler(model: Model, before: number, after: number): void {
        if (typeof after === "number") {
            let now = Date.now();
            if (!this.modelToCountHistories.has(model.uid)) {
                this.modelToCountHistories.set(model.uid, []);
            }

            // Delete any room count history older than maxHistoryMilliseconds
            let history = this.modelToCountHistories.get(model.uid) as Array<HistoricalCount>;
            while (history.length > 0 && (now - history[0].time) > this.maxHistoryMilliseconds) {
                history.shift();
            }

            // Push the current stats to history
            history.push({time: now, count: after});

            this.checkModelTrending(model);
        }
    }

    public getRoomCountAt(model: Model, millisecondsAgo: number/*, maxWiggle: number = 5 * 60 * 1000*/): number | undefined {
        let now = Date.now();
        let history = this.modelToCountHistories.get(model.uid);
        if (Array.isArray(history) && history.length > 0) {
            let targetTime = now - millisecondsAgo;
            /*let maxHistoricalTime = targetTime - maxWiggle;*/
            for (let i = history.length - 1; i > 0; i--) {
                if (history[i].time <= targetTime /*&& history[i].time >= maxHistoricalTime*/) {
                    return history[i].count;
                }
            }
        }
    }

    private checkModelTrending(model: Model): void {
        // Loop through all the criteria for which we
        // have set time and viewer count thresholds
        this.trendingCallbacks.forEach((trendingCallbacks2, duration) => {
            let previousCount = this.getRoomCountAt(model, duration);
            if (typeof previousCount === "number") {
                (this.trendingCallbacks.get(duration) as Map<number, Trending2Callback>).forEach((callback, countThreshold) => {
                    let currentCount = this.getRoomCountAt(model, 0);
                    if (typeof currentCount === "number") {
                        let delta = (currentCount - (previousCount as number));
                        if (delta >= countThreshold) {
                            callback(model, duration, delta);
                        }
                    }
                });
            }
        });
    }

    private checkAllModels(): void {
        this.modelToCountHistories.forEach((history, id) => {
            let possibleModel = Model.getModel(id);
            if (possibleModel !== undefined) {
                this.checkModelTrending(possibleModel);
            } else {
                this.modelToCountHistories.delete(id);
            }
        });
    }
}
