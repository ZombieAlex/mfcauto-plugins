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
        setInterval(this.modelUpdateCallback.bind(this), checkInterval);
    }
    Trending.prototype.modelUpdateCallback = function () {
        var _this = this;
        MFCAuto_1.Model.findModels(function (m) { return m.bestSession.vs !== MFCAuto_1.STATE.Offline
            && typeof m.bestSession.rc === "number"; }).forEach(function (m) {
            var currentCount = m.bestSession.rc;
            if (_this.modelToRoomCounts.has(m.uid)) {
                var previousCount = _this.modelToRoomCounts.get(m.uid);
                var delta = currentCount - previousCount;
                if (delta >= _this.trendingThreshold) {
                    _this.emit("trendingModel", m, delta);
                }
            }
            _this.modelToRoomCounts.set(m.uid, currentCount);
        });
    };
    Trending.prototype.vsHandler = function (model, before, after) {
        if (after === MFCAuto_1.STATE.Offline) {
            this.modelToRoomCounts.delete(model.uid);
        }
    };
    return Trending;
}());
exports.Trending = Trending;
MFCAuto_1.applyMixins(Trending, [events_1.EventEmitter]);
//# sourceMappingURL=Trending.js.map