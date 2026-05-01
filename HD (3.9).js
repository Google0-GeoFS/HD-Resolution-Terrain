// ==UserScript==
// @name         HD Resolution Terrain
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Gets higher resolution terrain
// @author       Google0
// @match        https://www.geo-fs.com/geofs.php?v=*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    const waitForGeoFS = (callback) => {
        const interval = setInterval(() => {
            if (window.geofs?.api && window.Cesium) {
                clearInterval(interval);
                callback();
            }
        }, 200);
    };

    waitForGeoFS(() => {
        // High-res Google Satellite Provider
        const hdImagery = new window.Cesium.UrlTemplateImageryProvider({
            maximumLevel: 21,
            hasAlphaChannel: false,
            subdomains: ["mt0", "mt1", "mt2", "mt3"],
            url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        });

        window.geofs.geoIpUpdate = function () {
            delete window.geofs.api.analytics;
            document.body.classList.add("geofs-hd");

            window.geofs.api.setImageryProvider(hdImagery, false);

            // Terrain Fix
            const terrain = new window.geofs.api.FlatRunwayTerrainProvider({
                baseProvider: new window.Cesium.CesiumTerrainProvider({
                    url: "https://data.geo-fs.com/srtm/",
                    requestVertexNormals: true
                }),
                maximumLevel: 12
            });
            window.geofs.api.viewer.terrainProvider = window.geofs.api.flatRunwayTerrainProviderInstance = terrain;
        };

        window.executeOnEventDone("geofsStarted", () => {
            if (!window.geofs?.api || window.geofs.api.hdOn) return;

            window.jQuery("body").trigger("terrainProviderWillUpdate");
            window.geofs.geoIpUpdate();
            window.geofs.api.hdOn = true;
            window.geofs.api.renderingQuality();
            window.jQuery("body").trigger("terrainProviderUpdate");
        });

        window.executeOnEventDone("afterDeferredload", () => {
            window.geofs.mapXYZ = "https://data.geo-fs.com/osm/{z}/{x}/{y}.png";
        });

        // Periodic Ad Clean
        setInterval(() => {
            document.querySelectorAll(".geofs-adbanner, .geofs-adsense-container").forEach(el => el.remove());
        }, 2000);
    });
})();
