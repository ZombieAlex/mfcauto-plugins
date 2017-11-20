"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MFCAuto_1 = require("MFCAuto");
const timers_1 = require("timers");
class Trending2 {
    constructor(maxHistoryMilliseconds = 30 * 60 * 1000) {
        this.offlineTimerMap = new Map();
        this.modelToCountHistories = new Map();
        this.trendingCallbacks = new Map();
        this.reset(maxHistoryMilliseconds);
        MFCAuto_1.Model.on("vs", this.vsHandler.bind(this));
        MFCAuto_1.Model.on("rc", this.rcHandler.bind(this));
    }
    reset(maxHistoryMilliseconds = this.maxHistoryMilliseconds) {
        this.maxHistoryMilliseconds = maxHistoryMilliseconds;
        this.trendingCallbacks.clear();
    }
    shutdown() {
        this.reset();
        this.offlineTimerMap.forEach((timer, uid) => {
            clearTimeout(timer);
        });
        this.offlineTimerMap.clear();
        this.modelToCountHistories.clear();
    }
    onTrendingThresholds(milliseconds, viewerCount, callback) {
        if (milliseconds > this.maxHistoryMilliseconds) {
            this.maxHistoryMilliseconds = milliseconds;
        }
        if (!this.trendingCallbacks.has(milliseconds)) {
            this.trendingCallbacks.set(milliseconds, new Map());
        }
        this.trendingCallbacks.get(milliseconds).set(viewerCount, callback);
        this.checkAllModels();
    }
    vsHandler(model, before, after) {
        if (after === MFCAuto_1.STATE.Offline) {
            this.offlineTimerMap.set(model.uid, timers_1.setTimeout(() => {
                if (model.bestSession.vs === MFCAuto_1.STATE.Offline) {
                    this.modelToCountHistories.delete(model.uid);
                }
                this.offlineTimerMap.delete(model.uid);
            }, 120 * 1000));
        }
    }
    rcHandler(model, before, after) {
        if (typeof after === "number") {
            let now = Date.now();
            if (!this.modelToCountHistories.has(model.uid)) {
                this.modelToCountHistories.set(model.uid, []);
            }
            let history = this.modelToCountHistories.get(model.uid);
            while (history.length > 0 && (now - history[0].time) > this.maxHistoryMilliseconds) {
                history.shift();
            }
            history.push({ time: now, count: after });
            this.checkModelTrending(model);
        }
    }
    getRoomCountAt(model, millisecondsAgo) {
        let now = Date.now();
        let history = this.modelToCountHistories.get(model.uid);
        if (Array.isArray(history) && history.length > 0) {
            let targetTime = now - millisecondsAgo;
            for (let i = history.length - 1; i > 0; i--) {
                if (history[i].time <= targetTime) {
                    return history[i].count;
                }
            }
        }
    }
    checkModelTrending(model) {
        this.trendingCallbacks.forEach((trendingCallbacks2, duration) => {
            let previousCount = this.getRoomCountAt(model, duration);
            if (typeof previousCount === "number") {
                this.trendingCallbacks.get(duration).forEach((callback, countThreshold) => {
                    let currentCount = this.getRoomCountAt(model, 0);
                    if (typeof currentCount === "number") {
                        let delta = (currentCount - previousCount);
                        if (delta >= countThreshold) {
                            callback(model, duration, delta);
                        }
                    }
                });
            }
        });
    }
    checkAllModels() {
        this.modelToCountHistories.forEach((history, id) => {
            let possibleModel = MFCAuto_1.Model.getModel(id);
            if (possibleModel !== undefined) {
                this.checkModelTrending(possibleModel);
            }
            else {
                this.modelToCountHistories.delete(id);
            }
        });
    }
}
exports.Trending2 = Trending2;
//# sourceMappingURL=Trending2.js.map