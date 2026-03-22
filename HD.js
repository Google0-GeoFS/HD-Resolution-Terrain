// ==UserScript==
// @name         HD Resolution Terrain
// @namespace    http://tampermonkey.net/
// @version      2026-03-22
// @description  Gets higher resolution images
// @author       Google0
// @match        https://www.geo-fs.com/geofs.php?v=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    "use strict";

    const provider = "google";
    const multiplayerServer = "default";

    // Wait until GeoFS is fully loaded
    function waitForGeoFS(callback) {
        const interval = setInterval(() => {
            if (window.geofs && window.geofs.api && window.Cesium) {
                clearInterval(interval);
                callback();
            }
        }, 200);
    }

    waitForGeoFS(() => {

        window.geofsNewHDState = true;

        window.geofs.geoIpUpdate = function () {

            // Safe remove analytics
            if (window.geofs.api && window.geofs.api.analytics) {
                delete window.geofs.api.analytics;
            }

            document.body.classList.add("geofs-hd");

            if (multiplayerServer !== "default") {
                window.geofs.multiplayerHost = multiplayerServer;
            }

            let imageryProvider = null;

            switch (provider) {

                case "cache":
                    imageryProvider = new window.Cesium.UrlTemplateImageryProvider({
                        maximumLevel: 21,
                        hasAlphaChannel: false,
                        subdomains: "abcdefghijklmnopqrstuvwxyz".split(""),
                        url: "http://localhost/map/{z}/{x}/{y}"
                    });
                    break;

                case "google":
                    imageryProvider = new window.Cesium.UrlTemplateImageryProvider({
                        maximumLevel: 21,
                        hasAlphaChannel: false,
                        subdomains: ["mt0", "mt1", "mt2", "mt3"],
                        url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    });
                    break;

                case "apple":
                    imageryProvider = new window.Cesium.UrlTemplateImageryProvider({
                        maximumLevel: 21,
                        hasAlphaChannel: false,
                        subdomains: ["sat-cdn1", "sat-cdn2", "sat-cdn3", "sat-cdn4"],
                        url: "https://{s}.apple-mapkit.com/tile?style=7&size=1&scale=1&z={z}&x={x}&y={y}&v=9651"
                    });
                    break;

                case "bing":
                    imageryProvider = new window.Cesium.BingMapsImageryProvider({
                        url: "https://dev.virtualearth.net",
                        key: "YOUR_BING_KEY_HERE",
                        mapStyle: window.Cesium.BingMapsStyle.AERIAL
                    });
                    break;
            }

            if (imageryProvider) {
                window.geofs.api.setImageryProvider(imageryProvider, false);
            }

            // Terrain (flat runway fix)
            window.geofs.api.viewer.terrainProvider =
                window.geofs.api.flatRunwayTerrainProviderInstance =
                new window.geofs.api.FlatRunwayTerrainProvider({
                    baseProvider: new window.Cesium.CesiumTerrainProvider({
                        url: "https://data.geo-fs.com/srtm/",
                        requestWaterMask: false,
                        requestVertexNormals: true
                    }),
                    bypass: false,
                    maximumLevel: 12
                });
        };

        // Apply after sim start
        window.executeOnEventDone("geofsStarted", function () {

            if (!window.geofs || !window.geofs.api) return;

            if (window.geofs.api.hdOn === window.geofsNewHDState) return;

            window.jQuery("body").trigger("terrainProviderWillUpdate");

            window.geofs.geoIpUpdate();

            window.geofs.api.hdOn = window.geofsNewHDState;
            window.geofs.api.renderingQuality();

            window.jQuery("body").trigger("terrainProviderUpdate");
        });

        // Fix map tiles
        window.executeOnEventDone("afterDeferredload", function () {
            window.geofs.mapXYZ = "https://data.geo-fs.com/osm/{z}/{x}/{y}.png";
        });

        // Safe ad removal
        const removeAds = () => {
            const ads = document.querySelectorAll(".geofs-adbanner, .geofs-adsense-container");
            ads.forEach(ad => ad.remove());
        };

        setInterval(removeAds, 2000);

    });

})();
