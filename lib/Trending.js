"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MFCAuto_1 = require("MFCAuto");
class Trending extends NodeJS.EventEmitter {
    constructor(trendingThreshold = 60, checkInterval = 60 * 1000) {
        super();
        this.trendingThreshold = trendingThreshold;
        this.modelToRoomCounts = new Map();
        this.intervalTimer = setInterval(this.modelUpdateCallback.bind(this), checkInterval);
    }
    shutdown() {
        clearInterval(this.intervalTimer);
        this.modelToRoomCounts.clear();
    }
    modelUpdateCallback() {
        MFCAuto_1.Model.findModels((m) => true).forEach((m) => {
            if (m.bestSession.vs === MFCAuto_1.STATE.Offline) {
                this.modelToRoomCounts.delete(m.uid);
            }
            else if (typeof m.bestSession.rc === "number") {
                let currentCount = m.bestSession.rc;
                if (this.modelToRoomCounts.has(m.uid)) {
                    let previousCount = this.modelToRoomCounts.get(m.uid);
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
exports.Trending = Trending;
//# sourceMappingURL=Trending.js.map