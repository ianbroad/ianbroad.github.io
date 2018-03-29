define([
    "require",
    "exports",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/Graphic",
    "esri/geometry/geometryEngine"
], function(require, exports, Map, MapView, FeatureLayer, Graphic, GeometryEngine) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var map = new Map({
        basemap: "streets"
    });
    var view = new MapView({
        map: map,
        container: "viewDiv",
        center: [-111.3, 52.68],
        zoom: 15
    });
    var sections = new FeatureLayer({
        url:
            "https://intervector.leoncountyfl.gov/intervector/rest/services/MapServices/TLC_OverlayPLSS_Leon_D_WM/MapServer/1"
    });
    map.add(sections);
    view.whenLayerView(sections).then(function(layer) {
        sections.queryExtent().then(function(response) {
            view.goTo(response.extent);
        });
    });
    var pointSymbol = {
        type: "simple-marker",
        color: "green"
    };
    var lineSymbol = {
        type: "simple-line",
        color: "green",
        width: 4
    };
    var polygonSymbol = {
        type: "simple-fill",
        color: [227, 139, 79, 0.8],
        outline: {
            color: [255, 255, 255],
            width: 1
        }
    };
    var textSymbol = {
        type: "text",
        color: "white",
        haloColor: "black",
        haloSize: "1px",
        text: "",
        font: {
            // autocast as new Font()
            size: 8,
            family: "sans-serif",
            weight: "bold"
        }
    };

    function addGraphicToMap(graphic) {
        view.graphics.add(graphic);
    }

    function createPoint(x, y) {
        var point = {
            type: "point",
            x: x,
            y: y,
            spatialReference: {
                wkid: 102100
            }
        };
        var pointGraphic = new Graphic({
            geometry: point,
            symbol: pointSymbol
        });
        return pointGraphic;
    }

    function createLine(point1, point2) {
        var line = {
            type: "polyline",
            paths: [[point1[0], point1[1]], [point2[0], point2[1]]],
            spatialReference: {
                wkid: 102100
            }
        };
        var lineGraphic = new Graphic({
            geometry: line,
            symbol: lineSymbol
        });
        return lineGraphic;
    }

    function createPolygon(geometry, attributes) {
        var polygonGraphic = new Graphic({
            geometry: geometry,
            symbol: polygonSymbol,
            attributes: attributes,
            popupTemplate: {
                title: "Attributes",
                content: "{*}"
            }
        });
        return polygonGraphic;
    }

    function createLabel(geometry, label) {
        textSymbol.text = label;
        var labelGraphic = new Graphic({
            geometry: geometry,
            symbol: textSymbol
        });
        return labelGraphic;
    }

    function getTopLeftVertex(array) {
        var xMin = null;
        var yMax = null;
        for (var i = 0; i < array.length; i++) {
            var x = array[i][0];
            var y = array[i][1];
            if (xMin === null) {
                xMin = x;
            } else if (x < xMin) {
                xMin = x;
            }
            if (yMax === null) {
                yMax = y;
            } else if (y > yMax) {
                yMax = y;
            }
        }
        return [xMin, yMax];
    }

    function getTopRightVertex(array) {
        var xMax = null;
        var yMax = null;
        for (var i = 0; i < array.length; i++) {
            var x = array[i][0];
            var y = array[i][1];
            if (xMax === null) {
                xMax = x;
            } else if (x > xMax) {
                xMax = x;
            }
            if (yMax === null) {
                yMax = y;
            } else if (y > yMax) {
                yMax = y;
            }
        }
        return [xMax, yMax];
    }

    function getBottomLeftVertex(array) {
        var xMin = null;
        var yMin = null;
        for (var i = 0; i < array.length; i++) {
            var x = array[i][0];
            var y = array[i][1];
            if (xMin === null) {
                xMin = x;
            } else if (x < xMin) {
                xMin = x;
            }
            if (yMin === null) {
                yMin = y;
            } else if (y < yMin) {
                yMin = y;
            }
        }
        return [xMin, yMin];
    }

    function getBottomRightVertex(array) {
        var xMax = null;
        var yMin = null;
        for (var i = 0; i < array.length; i++) {
            var x = array[i][0];
            var y = array[i][1];
            if (xMax === null) {
                xMax = x;
            } else if (x > xMax) {
                xMax = x;
            }
            if (yMin === null) {
                yMin = y;
            } else if (y < yMin) {
                yMin = y;
            }
        }
        return [xMax, yMin];
    }
    view.whenLayerView(sections).then(function(layer) {
        sections.queryFeatures().then(function(response) {
            for (var i = 0; i < response.features.length; i++) {
                var polygonFeature = response.features[i];
                var attributes = polygonFeature.attributes;
                var polygonGeometry = polygonFeature.geometry;
                var paths = polygonGeometry.rings[0];
                var polygonVertexArray = [];
                for (var i_1 = 0; i_1 < paths.length; i_1++) {
                    polygonVertexArray.push(paths[i_1]);
                }
                var TL = getTopLeftVertex(polygonVertexArray);
                var TR = getTopRightVertex(polygonVertexArray);
                var BL = getBottomLeftVertex(polygonVertexArray);
                var BR = getBottomRightVertex(polygonVertexArray);
                var lineGraphics = createSections(
                    TL[0],
                    TR[0],
                    TL[1],
                    TR[1],
                    BL[0],
                    BR[0],
                    BL[1],
                    BR[1],
                    2,
                    20
                );
                var linesGeomArray = [];
                for (var i_2 = 0; i_2 < lineGraphics.length; i_2++) {
                    linesGeomArray.push(lineGraphics[i_2].geometry);
                }
                var mergedLines = GeometryEngine.union(linesGeomArray);
                var cutPolygons = GeometryEngine.cut(polygonGeometry, mergedLines);
                var polygonArray = [];
                for (var i_3 = 0; i_3 < cutPolygons.length; i_3++) {
                    polygonArray.push([cutPolygons[i_3].centroid.x, cutPolygons[i_3].centroid.y]);
                }
                var TL_coords = getTopLeftVertex(polygonArray);
                var TR_coords = getTopRightVertex(polygonArray);
                var BL_coords = getBottomLeftVertex(polygonArray);
                var BR_coords = getBottomRightVertex(polygonArray);
                var TL_point = createPoint(TL_coords[0], TL_coords[1]);
                var TR_point = createPoint(TR_coords[0], TR_coords[1]);
                var BL_point = createPoint(BL_coords[0], BL_coords[1]);
                var BR_point = createPoint(BR_coords[0], BR_coords[1]);
                for (var i_4 = 0; i_4 < cutPolygons.length; i_4++) {
                    if (GeometryEngine.intersects(cutPolygons[i_4], TL_point.geometry)) {
                        attributes["Label"] = "NW";
                    } else if (GeometryEngine.intersects(cutPolygons[i_4], TR_point.geometry)) {
                        attributes["Label"] = "NE";
                    } else if (GeometryEngine.intersects(cutPolygons[i_4], BL_point.geometry)) {
                        attributes["Label"] = "SW";
                    } else if (GeometryEngine.intersects(cutPolygons[i_4], BR_point.geometry)) {
                        attributes["Label"] = "SE";
                    }
                    var sectionPolygon = createPolygon(cutPolygons[i_4], attributes);
                    var sectionLabel = createLabel(cutPolygons[i_4].centroid, attributes["Label"]);
                    addGraphicToMap(sectionPolygon);
                    addGraphicToMap(sectionLabel);
                }
            }
        });
    });

    function createSections(TLX, TRX, TLY, TRY, BLX, BRX, BLY, BRY, divisions, overflow) {
        var lineArray = [];
        var count = 1.0;
        while (count < divisions) {
            var a = TLX * ((divisions - count) / divisions) + TRX * (count / divisions);
            var b = TLY * ((divisions - count) / divisions) + TRY * (count / divisions);
            var c = BLX * ((divisions - count) / divisions) + BRX * (count / divisions);
            var d = BLY * ((divisions - count) / divisions) + BRY * (count / divisions);
            var extend1 = extend_lines([a, b], [c, d], overflow);
            var extend2 = extend_lines([c, d], [a, b], overflow);
            var line1 = createLine(extend1, extend2);
            lineArray.push(line1);
            var e = TLX * ((divisions - count) / divisions) + BLX * (count / divisions);
            var f = TLY * ((divisions - count) / divisions) + BLY * (count / divisions);
            var g = TRX * ((divisions - count) / divisions) + BRX * (count / divisions);
            var h = TRY * ((divisions - count) / divisions) + BRY * (count / divisions);
            var extend3 = extend_lines([e, f], [g, h], overflow);
            var extend4 = extend_lines([g, h], [e, f], overflow);
            var line2 = createLine(extend3, extend4);
            lineArray.push(line2);
            count += 1.0;
        }
        return lineArray;
    }

    function extend_lines(point1, point2, overflow) {
        var x1 = point1[0];
        var y1 = point1[1];
        var x2 = point2[0];
        var y2 = point2[1];
        var distance_x = x2 - x1;
        var distance_y = y2 - y1;
        var length = Math.hypot(distance_x, distance_y);
        var x3 = x2 + distance_x / length * overflow;
        var y3 = y2 + distance_y / length * overflow;
        return [x3, y3];
    }
});
//# sourceMappingURL=main.js.map
