"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var MFCAuto_1 = require("MFCAuto");
var Trending = (function () {
    function Trending(trendingThreshold, checkInterval) {
        if (trendingThreshold === void 0) { trendingThreshold = 60; }
        if (checkInterval === void 0) { checkInterval = 60 * 1000; }
        this.trendingThreshold = trendingThreshold;
        this.modelToRoomCounts = new Map();
        this.intervalTimer = setInterval(this.modelUpdateCallback.bind(this), checkInterval);
    }
    Trending.prototype.shutdown = function () {
        clearInterval(this.intervalTimer);
        this.modelToRoomCounts.clear();
    };
    Trending.prototype.modelUpdateCallback = function () {
        var _this = this;
        MFCAuto_1.Model.findModels(function (m) { return true; }).forEach(function (m) {
            if (m.bestSession.vs === MFCAuto_1.STATE.Offline) {
                _this.modelToRoomCounts.delete(m.uid);
            }
            else if (typeof m.bestSession.rc === "number") {
                var currentCount = m.bestSession.rc;
                if (_this.modelToRoomCounts.has(m.uid)) {
                    var previousCount = _this.modelToRoomCounts.get(m.uid);
                    var delta = currentCount - previousCount;
                    if (delta >= _this.trendingThreshold) {
                        _this.emit("trendingModel", m, delta);
                    }
                }
                _this.modelToRoomCounts.set(m.uid, currentCount);
            }
        });
    };
    return Trending;
}());
exports.Trending = Trending;
MFCAuto_1.applyMixins(Trending, [events_1.EventEmitter]);
//# sourceMappingURL=Trending.js.map