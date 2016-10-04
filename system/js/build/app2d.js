(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var ves2d = require('../core/vessels-2d.js'),
    __s__ = require('../utils/js-helpers.js'),
    __d__ = require('../utils/dom-utilities.js'),
    colorWidget = require('../colors/colors-widget.js'),
    i18labels = require('../core/i18labels.js');

var app2d,
    data,
    queryParams = __s__.getQueryParams(),
    btnLaunch = document.getElementById("btnLaunch");

window.appVessels2D = ves2d.VesselsApp2D;

/* Main program 2D ------------------------------------------------  */

//Example
app2d = new ves2d.VesselsApp2D(btnLaunch);
app2d.loadUrl(queryParams.json, i18labels.LOADING_DATA).then(function (loadedData) {
    var modelsFactory = app2d.modelsFactory,
        clrs = undefined,
        maxDepth = undefined,
        maxDepthHalf = undefined;

    //--Start: This is needed for stand-alone functioning
    //Process data
    app2d.data = app2d.loadData(loadedData);

    //Pass 1. Map to  models
    for (var j = 0, lenJ = app2d.data.data.info.contsL; j < lenJ; j += 1) {
        modelsFactory.addIsoModel(app2d.data.data.conts[j]);
    }

    //Pass 2. Add colors (random)
    modelsFactory.extendSpecs(app2d.data.filters);

    //Pass 3. Get colors from settings
    clrs = new colorWidget.ColorsWidget(null, app2d.data.filters, null);
    if (window.userSettings) {
        clrs.mergeColorSettings(window.userSettings);
    }

    app2d.applyColorsFilter(app2d.data.filters);

    //--End: This is needed for stand-alone functioning

    //app2d
    app2d.setTitle(loadedData.VesselName, loadedData.PlaceOfDeparture, loadedData.VoyageNumber);
    app2d.postUrl = "php/generatePDF.php";
}, function (msg) {
    console.error(msg);
});

window.example2d = app2d;

},{"../colors/colors-widget.js":2,"../core/i18labels.js":4,"../core/vessels-2d.js":6,"../utils/dom-utilities.js":7,"../utils/js-helpers.js":8}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var __s__ = require('../utils/js-helpers.js'),
    __d__ = require('../utils/dom-utilities.js'),
    i18labels = require('../core/i18labels.js');

//Class ColorsWidget

var ColorsWidget = (function () {
    function ColorsWidget(btn, filters) {
        var referenz = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

        _classCallCheck(this, ColorsWidget);

        var me = this;

        this.isOpened = false;
        this.btn = btn;
        this.referenz = referenz;
        this.filters = filters || {};

        this._currentOption = null;

        this._node = (function () {
            var divMainC = undefined,
                dropdwn = undefined,
                ulColors = undefined,
                btnSave = undefined,
                btnCancel = undefined,
                colorPickerDiv = undefined,
                colorPickerJoe = undefined,
                key = undefined,
                filter = undefined,
                arrLis = [],
                divHolder = undefined,
                baseId = "colors-container-" + Math.round(Math.random() * 100000);

            //Main DOM element
            divMainC = document.createElement("div");
            divMainC.className = "colors-container";
            divMainC.innerHTML = "<h2>" + i18labels.CLICK_TO_CHANGE_COLORS + "</h2>";
            divMainC.id = baseId;

            divHolder = document.createElement("div");
            divHolder.className = "colors-container-top";

            dropdwn = document.createElement("SELECT");
            dropdwn.id = baseId + "-dropdwn";
            divHolder.appendChild(dropdwn);

            //Populate dropdown
            for (key in filters) {
                filter = filters[key];
                arrLis.push("<option value='" + key + "'>" + filter.name + "</option>");
            }
            dropdwn.innerHTML = arrLis.join("");

            btnSave = document.createElement("button");
            btnSave.innerHTML = "SAVE";
            divHolder.appendChild(btnSave);

            btnCancel = document.createElement("button");
            btnCancel.innerHTML = "CANCEL";
            divHolder.appendChild(btnCancel);

            divMainC.appendChild(divHolder);

            ulColors = document.createElement("ul");
            ulColors.className = "colors-container-ulColors";
            ulColors.id = baseId + "-ulColors";
            divMainC.appendChild(ulColors);

            colorPickerDiv = document.createElement("div");
            colorPickerDiv.className = "colors-container-colorPicker";
            colorPickerDiv.id = baseId + "-colorPicker";
            divMainC.appendChild(colorPickerDiv);

            //Refs
            divMainC.dropdwn = dropdwn;
            divMainC.ulColors = ulColors;
            divMainC.colorPickerDiv = colorPickerDiv;
            divMainC.btnSave = btnSave;
            divMainC.btnCancel = btnCancel;
            divMainC.colorsTemp = {};

            document.body.appendChild(divMainC);

            if (btn) {
                __d__.addEventLnr(btn, "click", me.toggleHandler.bind(me));
                __d__.addEventLnr(dropdwn, "change", me.dropFilterChanged.bind(me));
                __d__.addEventLnr(btnCancel, "click", me.close.bind(me));
                __d__.addEventLnr(btnSave, "click", me.saveColors.bind(me));
                __d__.addEventLnr(ulColors, "click", me.selectOption.bind(me));
            }

            return divMainC;
        })();

        //Optional callbacks
        this.onToggled = null;
        this.onSaved = null;
        this.postUrl = null;

        this._jsonColors = {};
    }

    //Updates filters with json.colors

    _createClass(ColorsWidget, [{
        key: 'mergeColorSettings',
        value: function mergeColorSettings(json) {
            var jsonObj = json,
                key = undefined,
                color = undefined,
                key2 = undefined,
                filters = this.filters,
                arr = undefined,
                compoundKey = undefined;

            if (typeof json === "String") {
                jsonObj = JSON.parse(json);
            }
            if (!jsonObj.colors) {
                console.warn(i18labels.NO_COLOR_SETTINGS);return;
            }

            for (key in jsonObj.colors) {
                arr = key.split(".");

                if (!filters[arr[0]] || !filters[arr[0]].obs.hasOwnProperty(arr[1])) {
                    continue;
                }

                color = jsonObj.colors[key];
                filters[arr[0]].obs[arr[1]].color = color;
                filters[arr[0]].obs[arr[1]].hexColor = parseInt(color.replace(/^#/, ''), 16);
                filters[arr[0]].obs[arr[1]].colorIsRandom = false;
            }

            this._jsonColors = jsonObj.colors;
        }
    }, {
        key: 'toggleHandler',
        value: function toggleHandler(ev) {
            this.toggle(!this.isOpened);
        }
    }, {
        key: 'close',
        value: function close() {
            this.toggle(false);
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            var doOpen = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            var filters = this.filters;
            this._node.style.display = doOpen ? "block" : "none";
            this.isOpened = doOpen;

            if (!doOpen) {
                if (this.onToggled) {
                    this.onToggled(false);
                }return;
            }

            //Following code when the widget is opened
            this._node.colorsTemp = {};

            if (this.referenz && this.referenz.value !== "" && filters[this.referenz.value]) {
                this._node.dropdwn.value = this.referenz.value;
            }

            //Populate color options
            this.dropFilterChanged();

            //If callback
            if (this.onToggled) {
                this.onToggled(true);
            }
        }
    }, {
        key: 'dropFilterChanged',
        value: function dropFilterChanged() {
            var me = this,
                arr = [],
                key = undefined,
                tfLabels = { "0": "no", "1": "yes" },
                filterKey = this._node.dropdwn.value,
                currFilter = this.filters[filterKey],
                lis = undefined,
                firstLi = undefined,
                currColor = undefined;

            for (key in currFilter.obs) {
                currColor = me._node.colorsTemp[filterKey + "." + key] || currFilter.obs[key].color;
                arr.push("<li data-color='" + currColor + "' id='liColor_" + filterKey + "." + key + "'><span style='background:" + currColor + "'> </span>" + (currFilter.tf ? tfLabels[key] : key) + "&nbsp;</li>");
            }

            this._node.ulColors.innerHTML = arr.join("");
            lis = this._node.ulColors.getElementsByTagName("LI");
            if (!lis || lis.length === 0) {
                return;
            }

            firstLi = lis[0];
            firstLi.className = "selected";
            this._currentOption = firstLi;

            //Initialize colorPicker
            if (!this._node.colorPickerJoe) {
                this._node.colorPickerJoe = colorjoe.rgb(this._node.colorPickerDiv, firstLi.getAttribute("data-color"));
                this._node.colorPickerJoe.on("change", function (color) {
                    me._currentOption.setAttribute("data-color", color.hex());
                    me._currentOption.getElementsByTagName("SPAN")[0].style.background = color.hex();
                    me._node.colorsTemp[me._currentOption.id.replace("liColor_", "")] = color.hex();
                });
            } else {
                this._node.colorPickerJoe.set(firstLi.getAttribute("data-color"));
            }
        }
    }, {
        key: 'selectOption',
        value: function selectOption(ev) {
            var me = this,
                li = ev.target,
                lis = undefined,
                j = undefined,
                lenJ = undefined;

            if (li.tagName !== "LI") {
                return;
            }
            lis = this._node.ulColors.getElementsByTagName("LI");
            if (li.className === "selected") {
                return;
            }

            for (j = 0, lenJ = lis.length; j < lenJ; j += 1) {
                if (li !== lis[j]) {
                    lis[j].className = "";
                }
            }

            setTimeout(function () {
                li.className = "selected";
                me._node.colorPickerJoe.set(li.getAttribute("data-color"), true);
                me._currentOption = li;
            }, 150);
        }
    }, {
        key: 'saveColors',
        value: function saveColors() {
            var key = undefined,
                colorsTemp = this._node.colorsTemp,
                filters = this.filters,
                filtersCustomized = {},
                dataToPost = [],
                arr = undefined,
                color = undefined,
                req = undefined;

            for (key in colorsTemp) {
                arr = key.split(".");
                if (arr.length !== 2) {
                    continue;
                }

                color = colorsTemp[key];
                filters[arr[0]].obs[arr[1]].color = color;
                filters[arr[0]].obs[arr[1]].hexColor = parseInt(color.replace(/^#/, ''), 16);
                filters[arr[0]].obs[arr[1]].colorIsRandom = false;

                if (!filtersCustomized[arr[0]]) {
                    filtersCustomized[arr[0]] = true;
                }

                dataToPost.push({ attributeKey: arr[0], attributeValue: arr[1], hexColor: color });
            }

            this.close();

            if (this.onSaved) {
                this.onSaved(filters, colorsTemp, filtersCustomized);
            }

            if (!this.postUrl) {
                return;
            }

            req = new XMLHttpRequest();
            req.open('POST', this.postUrl);
            req.setRequestHeader('Content-Type', 'application/json');
            req.onreadystatechange = function () {
                if (req.readyState === 4 && req.status === 200) {
                    console.log(req.responseText);
                }
            };
            req.send(JSON.stringify(dataToPost));
        }
    }]);

    return ColorsWidget;
})();

exports.ColorsWidget = ColorsWidget;

},{"../core/i18labels.js":4,"../utils/dom-utilities.js":7,"../utils/js-helpers.js":8}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var i18labels = require('./i18labels.js');
var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');

var DataLoader = (function () {
    function DataLoader(divLoading) {
        _classCallCheck(this, DataLoader);

        this.divLoading = divLoading;
    }

    //Takes an URL and loads the data.
    //Promise: resolves with the data obj.

    _createClass(DataLoader, [{
        key: 'loadUrl',
        value: function loadUrl(jsonUrl) {
            var loadingText = arguments.length <= 1 || arguments[1] === undefined ? "" : arguments[1];
            var progressCallback = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

            var me = this;

            return new Promise(function (resolve, reject) {
                var req = undefined,
                    ajaxError = function ajaxError(evt) {
                    if (me.divLoading) {
                        me.divLoading.setMessage(evt.responseText, true);
                        me.divLoading.updateLoader(0.0, 1.0);
                    }
                    console.error(evt);
                },
                    transferProgress = function transferProgress(evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        me.divLoading.updateLoader(percentComplete, 0.5);
                    }
                };

                function transferComplete(ev) {
                    var d = undefined;
                    try {
                        if (req.status === 200) {
                            d = JSON.parse(req.responseText);
                            resolve(d); //<----- Resolves
                        } else {
                                reject(req.statusText);
                            }
                    } catch (e) {
                        reject(i18labels.ERROR_PARSING_JSON + " " + e.description);
                    }
                } //transferComplete

                if (!jsonUrl) {
                    reject(i18labels.INVALID_DATA_SOURCE);
                    return;
                }

                if (me.divLoading) {
                    me.divLoading.show();
                    me.divLoading.startAnimation();
                    if (loadingText) {
                        me.divLoading.setMessage(loadingText);
                    }
                }

                req = new XMLHttpRequest();

                __d__.addEventLnr(req, "load", transferComplete);
                __d__.addEventLnr(req, "error", ajaxError);
                if (me.divLoading || progressCallback !== null) {
                    __d__.addEventLnr(req, "progress", progressCallback || transferProgress);
                }

                req.open('GET', jsonUrl + (jsonUrl.indexOf("?") > 0 ? "&" : "?") + "t=" + new Date() * 1);
                req.send();
            });
        }

        //Takes a JSON Vessels info
        //Returns processed data
    }, {
        key: 'generateStructuredData',
        value: function generateStructuredData(d) {

            var lenD = undefined,
                j = undefined,
                obj = undefined,
                lenJ = undefined,
                hCalc = undefined,
                tmp = undefined,
                bb = 0,
                bc = 0,
                bt = 0,
                bays = {},
                cells = {},
                tiers = {},
                belowTiers = undefined,
                aboveTiers = undefined,
                data = undefined,
                dataStructured = undefined,
                filters = undefined,
                dataStructuredKeysArr = [],
                key = undefined,
                keyEven = undefined,
                keyEvenPrev = undefined,
                iTierMin = undefined,
                iTierMinAbove = undefined,
                iTierMax = undefined,
                iTierMaxAbove = undefined,
                maxWidth = 0,
                lastBay = "",
                hasZeroCell = false,
                maxCell = 0,
                numContsByBay = {},
                containersIDs = {},
                allContainerMeshesObj = {};

            function addStructured(ob) {
                var bay2 = ob.bay,
                    ibay = ob.iBay;
                if (ibay % 2 === 0) {
                    bay2 = __s__.pad(ibay - 1, 3);
                }

                if (!numContsByBay[ob.bay]) {
                    numContsByBay[ob.bay] = 1;
                } else {
                    numContsByBay[ob.bay] += 1;
                }

                if (!dataStructured[bay2]) {
                    dataStructured[bay2] = { cells: {}, n: 0 };
                    dataStructured.n += 1;
                    dataStructured[bay2].maxD = 20;
                    dataStructuredKeysArr.push(bay2);
                }
                if (!dataStructured[bay2].cells[ob.cell]) {
                    dataStructured[bay2].cells[ob.cell] = { tiers: {}, n: 0 };
                    dataStructured[bay2].n += 1;
                    if (!hasZeroCell && ob.cell === "00") {
                        hasZeroCell = true;
                    }
                }
                dataStructured[bay2].cells[ob.cell].tiers[ob.tier] = ob;
                dataStructured[bay2].cells[ob.cell].n += 1;

                if (maxWidth < dataStructured[bay2].n) {
                    maxWidth = dataStructured[bay2].n;
                }
                if (ob.depth > dataStructured[bay2].maxD) {
                    dataStructured[bay2].maxD = ob.depth;
                }
                if (obj.tier < "78") {
                    if (!belowTiers.tiers[obj.tier]) {
                        belowTiers.tiers[obj.tier] = { h: ob.h, accH: 0 };
                        belowTiers.n += 1;
                    }
                    if (ob.h > belowTiers.tiers[obj.tier].h) {
                        belowTiers.tiers[obj.tier].h = ob.h;
                    }
                } else {
                    if (!aboveTiers.tiers[obj.tier]) {
                        aboveTiers.tiers[obj.tier] = { h: ob.h, accH: 0 };
                        aboveTiers.n += 1;
                    }
                }
                if (!tiers[obj.tier]) {
                    tiers[obj.tier] = { maxH: obj.h };
                } else {
                    tiers[obj.tier].maxH = Math.max(tiers[obj.tier].maxH, obj.h);
                }
            }

            function addFilter(vv, name, tf) {
                filters[vv] = { name: name, obs: {}, tf: tf };
            }

            function connectToFilters(ob) {
                if (!filters.s.obs[ob.s]) {
                    filters.s.obs[ob.s] = { c: 1, indexes: [] };
                }
                if (!filters.i.obs[ob.i]) {
                    filters.i.obs[ob.i] = { c: 1, indexes: [] };
                }
                if (!filters.r.obs[ob.r]) {
                    filters.r.obs[ob.r] = { c: 1, indexes: [] };
                }
                if (!filters.w.obs[ob.w]) {
                    filters.w.obs[ob.w] = { c: 1, indexes: [] };
                }
                if (!filters.o.obs[ob.o]) {
                    filters.o.obs[ob.o] = { c: 1, indexes: [] };
                }
                if (!filters.d.obs[ob.d]) {
                    filters.d.obs[ob.d] = { c: 1, indexes: [] };
                }
                if (!filters.f.obs[ob.f]) {
                    filters.f.obs[ob.f] = { c: 1, indexes: [] };
                }
                if (!filters.t.obs[ob.t]) {
                    filters.t.obs[ob.t] = { c: 1, indexes: [] };
                }
                if (!filters.x.obs[ob.x]) {
                    filters.x.obs[ob.x] = { c: 1, indexes: [] };
                }
                filters.s.obs[ob.s].indexes.push(ob);
                filters.i.obs[ob.i].indexes.push(ob);
                filters.r.obs[ob.r].indexes.push(ob);
                filters.w.obs[ob.w].indexes.push(ob);
                filters.o.obs[ob.o].indexes.push(ob);
                filters.d.obs[ob.d].indexes.push(ob);
                filters.f.obs[ob.f].indexes.push(ob);
                filters.t.obs[ob.t].indexes.push(ob);
                filters.x.obs[ob.x].indexes.push(ob);
            }

            //Initialize the data object
            data = {
                conts: d["3DVesselData"],
                info: { contsL: d["3DVesselData"].length }
            };

            //Initialize structured data objects
            dataStructured = { n: 0 };
            belowTiers = { n: 0, tiers: {} };
            aboveTiers = { n: 0, tiers: {} };

            //Initialize filters
            filters = {};
            addFilter("i", "Container ISO", false);
            addFilter("s", "Full", true);
            addFilter("r", "Reefer", true);
            addFilter("w", "Hazardous", true);
            addFilter("t", "Tank", true);
            addFilter("x", "OOG", true);
            addFilter("o", "Operator", false);
            addFilter("d", "Destination", false);
            addFilter("f", "Load Port", false);

            //Iterate through data
            for (j = 0, lenD = data.conts.length; j < lenD; j += 1) {

                obj = data.conts[j];
                obj.bay = obj.p.substr(0, 3);
                obj.cell = obj.p.substr(3, 2);
                obj.tier = obj.p.substr(5, 2);
                obj.h = Number(Math.floor(obj.h)) + (obj.h - Math.floor(obj.h)) * 5 / 6;
                obj.depth = Number(Math.floor(obj.l)) + (obj.l - Math.floor(obj.l)) * 5 / 6;
                obj.iBay = Number(obj.bay);
                obj.iTier = Number(obj.tier);
                obj.myJ = j;
                obj.cDash = obj.c.replace(/\s/ig, "-");

                containersIDs["cont_" + obj.cDash] = obj;

                addStructured(obj);
                connectToFilters(obj);
            }

            //Iterate trough bays
            lastBay = _.max(_.keys(dataStructured));
            for (j = 1, lenD = Number(lastBay); j <= lenD; j += 2) {
                key = __s__.pad(j, 3);
                keyEvenPrev = __s__.pad(j - 1, 3);

                if (!dataStructured[key]) {
                    continue;
                }

                dataStructured[key].isBlockStart = true;
                if (numContsByBay[keyEvenPrev]) {
                    dataStructured[key].isBlockStart = false;
                }

                dataStructured[key].maxCell = _.chain(dataStructured[key].cells).keys().sort().last().value();
            }

            //Min/Max tiers below & above
            iTierMin = Number(_.min(_.keys(belowTiers.tiers)));
            iTierMinAbove = Number(_.min(_.keys(aboveTiers.tiers)));
            iTierMax = Number(_.max(_.keys(belowTiers.tiers)));
            iTierMaxAbove = Number(_.max(_.keys(aboveTiers.tiers)));

            return {
                data: data,
                dataStructured: dataStructured,
                dataStructuredKeysArr: dataStructuredKeysArr.sort(__s__.sortNumeric),
                belowTiers: belowTiers,
                aboveTiers: aboveTiers,
                containersIDs: containersIDs,
                numContsByBay: numContsByBay,
                allContainerMeshesObj: allContainerMeshesObj,
                filters: filters,
                iTierMin: iTierMin,
                iTierMinAbove: iTierMinAbove,
                iTierMax: iTierMax,
                iTierMaxAbove: iTierMaxAbove,
                tiers: tiers,
                maxWidth: maxWidth,
                firstBay: _.min(_.keys(dataStructured)),
                lastBay: lastBay,
                hasZeroCell: hasZeroCell
            };
        }
    }]);

    return DataLoader;
})();

exports.DataLoader = DataLoader;

},{"../utils/dom-utilities.js":7,"../utils/js-helpers.js":8,"./i18labels.js":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var LOADING_DATA = "Loading 3D Model...";

exports.LOADING_DATA = LOADING_DATA;
var INVALID_DATA_SOURCE = "Error: Missing data source.";
exports.INVALID_DATA_SOURCE = INVALID_DATA_SOURCE;
var ERROR_PARSING_JSON = "Error while parsing the JSON file.";

exports.ERROR_PARSING_JSON = ERROR_PARSING_JSON;
var CLICK_TO_CHANGE_COLORS = "Click on colors to change them";
exports.CLICK_TO_CHANGE_COLORS = CLICK_TO_CHANGE_COLORS;
var NO_COLOR_SETTINGS = "No color settings found. Will use random.";

exports.NO_COLOR_SETTINGS = NO_COLOR_SETTINGS;
var PRINTOPTS_TITLE = "Please select the document options";
exports.PRINTOPTS_TITLE = PRINTOPTS_TITLE;
var PRINTOPTS_ORIENTATION = "Orientation";
exports.PRINTOPTS_ORIENTATION = PRINTOPTS_ORIENTATION;
var PRINTOPTS_ORIENTATION_LANDSCAPE = "Landscape";
exports.PRINTOPTS_ORIENTATION_LANDSCAPE = PRINTOPTS_ORIENTATION_LANDSCAPE;
var PRINTOPTS_ORIENTATION_PORTRAIT = "Portrait";
exports.PRINTOPTS_ORIENTATION_PORTRAIT = PRINTOPTS_ORIENTATION_PORTRAIT;
var PRINTOPTS_DPI = "Printer DPI";
exports.PRINTOPTS_DPI = PRINTOPTS_DPI;
var PRINTOPTS_SIZE = "Paper Size";
exports.PRINTOPTS_SIZE = PRINTOPTS_SIZE;
var PRINTOPTS_GO = "GENERATE PDF";
exports.PRINTOPTS_GO = PRINTOPTS_GO;
var PRINTOPTS_PERROW = "Bays per row";
exports.PRINTOPTS_PERROW = PRINTOPTS_PERROW;
var PRINTOPTS_COLORBY = "Color by";
exports.PRINTOPTS_COLORBY = PRINTOPTS_COLORBY;
var PRINTOPTS_PAGEPROGRESS = "Generating pages, please wait...";
exports.PRINTOPTS_PAGEPROGRESS = PRINTOPTS_PAGEPROGRESS;
var PRINTOPTS_SENDINGPAGES = "Sending pages, please wait...";
exports.PRINTOPTS_SENDINGPAGES = PRINTOPTS_SENDINGPAGES;
var PRINTOPTS_DOWNLOAD = "Download PDF";
exports.PRINTOPTS_DOWNLOAD = PRINTOPTS_DOWNLOAD;

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var RColor = require('../utils/random-color.js');

var ModelsFactory = (function () {
    function ModelsFactory(appScene) {
        _classCallCheck(this, ModelsFactory);

        this.models = {};
        this.isoModels = {};
        this.appScene = appScene;
    }

    _createClass(ModelsFactory, [{
        key: 'addIsoModel',
        value: function addIsoModel(obj) {
            var me = this,
                isoModels = me.isoModels;

            if (!isoModels[obj.i]) {
                isoModels[obj.i] = {
                    d: obj.depth,
                    h: obj.h,
                    t: obj.t
                };
            }
        }
    }, {
        key: 'extendSpecs',
        value: function extendSpecs(filters) {
            var j,
                lenJ,
                key,
                val,
                attr,
                spec,
                me = this,
                rcolor = new RColor.RColor(),
                color,
                hexColor;

            for (key in filters) {
                attr = filters[key];
                for (val in attr.obs) {

                    spec = attr.obs[val];

                    color = rcolor.get(true);
                    hexColor = parseInt(color.replace(/^#/, ''), 16);

                    spec.color = color;
                    spec.hexColor = hexColor;
                    spec.colorIsRandom = true;
                }
            }
        }
    }, {
        key: 'createBaseMaterials',
        value: function createBaseMaterials(filters) {
            var j,
                lenJ,
                key,
                val,
                attr,
                spec,
                me = this,
                material,
                materialPos,
                hexColor,
                renderer3d = this.appScene.renderer3d;

            for (key in filters) {
                attr = filters[key];
                for (val in attr.obs) {

                    spec = attr.obs[val];

                    hexColor = spec.hexColor;
                    materialPos = renderer3d.addContainerMaterial(hexColor);

                    spec.materialPos = materialPos;
                }
            }
        }
    }]);

    return ModelsFactory;
})();

exports.ModelsFactory = ModelsFactory;

},{"../utils/random-color.js":10}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');
var Preloader = require('../utils/preloader.js');
var DataLoader = require('./data-loader.js');
var ModelsFactory = require('./models-factory.js');
var i18labels = require('./i18labels.js');

//Class VesselsApp2D

var VesselsApp2D = (function () {
    function VesselsApp2D(btnLaunch) {
        var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, VesselsApp2D);

        var me = this;

        var version = 1.0;

        this.options = __s__.extend({
            loaderColor: "#f2f2f2",
            loaderColorSucess: "#79e3da",
            sizes: [{ name: "Letter", w: 8.5, h: 11.0 }, { name: "Legal", w: 8.5, h: 14.0 }, { name: "A4", w: 8.3, h: 11.7 }, { name: "A3", w: 11.7, h: 16.5 }],
            dpis: [{ name: "300 dpi", res: 300 }, { name: "600 dpi", res: 600 }],
            padding: { w: 0.06, h: 15.0 },
            aboveBelowSep: 2
        }, opts);

        this._node = (function () {
            var divMainC = undefined,
                divForm = undefined,
                divProgress = undefined,
                dropdwnOr = undefined,
                dropdwnSz = undefined,
                dropdwnDp = undefined,
                dropdwnRw = undefined,
                dropdwnClr = undefined,
                spanOr = undefined,
                ulColors = undefined,
                btnSave = undefined,
                btnCancel = undefined,
                colorPickerDiv = undefined,
                colorPickerJoe = undefined,
                key = undefined,
                filter = undefined,
                arrLis = [],
                divHolder = undefined,
                k = undefined,
                baseId = "printopts-container-" + Math.round(Math.random() * 100000);

            //Main DOM element
            divMainC = document.createElement("div");
            divMainC.className = "printopts-container";
            divMainC.id = baseId;

            divForm = document.createElement("div");
            divForm.className = "printopts-form";
            divForm.innerHTML = "<h2>" + i18labels.PRINTOPTS_TITLE + "</h2>";
            divForm.id = baseId + "-form";
            divMainC.appendChild(divForm);

            divProgress = document.createElement("div");
            divProgress.className = "printopts-progress";
            divProgress.id = baseId + "-progress";
            divMainC.appendChild(divProgress);

            divHolder = document.createElement("div");
            divHolder.className = "printopts-container-top";
            divForm.appendChild(divHolder);

            //Orientation
            dropdwnOr = document.createElement("SELECT");
            dropdwnOr.id = baseId + "-dropdwn-orientation";
            divHolder.appendChild(dropdwnOr);

            arrLis = [];
            arrLis.push("<option value='0'>" + i18labels.PRINTOPTS_ORIENTATION_LANDSCAPE + "</option>");
            arrLis.push("<option value='1'>" + i18labels.PRINTOPTS_ORIENTATION_PORTRAIT + "</option>");
            dropdwnOr.innerHTML = arrLis.join("");

            //DPI
            dropdwnDp = document.createElement("SELECT");
            dropdwnDp.id = baseId + "-dropdwn-dpi";
            divHolder.appendChild(dropdwnDp);

            arrLis = [];
            for (key in me.options.dpis) {
                filter = me.options.dpis[key];
                arrLis.push("<option value='" + key + "'>" + filter.name + "</option>");
            }
            dropdwnDp.innerHTML = arrLis.join("");

            //Sizes
            dropdwnSz = document.createElement("SELECT");
            dropdwnSz.id = baseId + "-dropdwn-sizes";
            divHolder.appendChild(dropdwnSz);

            arrLis = [];
            for (key in me.options.sizes) {
                filter = me.options.sizes[key];
                arrLis.push("<option value='" + key + "'>" + filter.name + "</option>");
            }
            dropdwnSz.innerHTML = arrLis.join("");

            //Per Row
            dropdwnRw = document.createElement("SELECT");
            dropdwnRw.id = baseId + "-dropdwn-perrow";
            divHolder.appendChild(dropdwnRw);

            //Color by
            dropdwnClr = document.createElement("SELECT");
            dropdwnClr.id = baseId + "-dropdwn-colorby";
            divHolder.appendChild(dropdwnClr);

            //Buttons
            btnSave = document.createElement("button");
            btnSave.innerHTML = i18labels.PRINTOPTS_GO;
            btnSave.className = "save";
            divForm.appendChild(btnSave);

            spanOr = document.createElement("span");
            spanOr.innerHTML = " or ";
            divForm.appendChild(spanOr);

            btnCancel = document.createElement("button");
            btnCancel.innerHTML = "CANCEL";
            divForm.appendChild(btnCancel);

            //Refs
            divMainC.dropdwnOr = dropdwnOr;
            divMainC.dropdwnSz = dropdwnSz;
            divMainC.dropdwnDp = dropdwnDp;
            divMainC.dropdwnRw = dropdwnRw;
            divMainC.dropdwnClr = dropdwnClr;
            divMainC.btnSave = btnSave;
            divMainC.btnCancel = btnCancel;
            divMainC.divForm = divForm;
            divMainC.divProgress = divProgress;

            document.body.appendChild(divMainC);

            if (btnLaunch) {
                __d__.addEventLnr(btnLaunch, "click", me.toggleHandler.bind(me));
                __d__.addEventLnr(dropdwnOr, "change", me.dropFilterChanged.bind(me));
                __d__.addEventLnr(dropdwnSz, "change", me.dropFilterChanged.bind(me));
                __d__.addEventLnr(dropdwnDp, "change", me.dropFilterChanged.bind(me));
                __d__.addEventLnr(btnCancel, "click", me.close.bind(me));
                __d__.addEventLnr(btnSave, "click", me.launchPdfStart.bind(me));
            }

            return divMainC;
        })();

        this.title = "";
        this.btnLaunch = btnLaunch;
        this.width = 0;
        this.height = 0;
        this.inchFactor = 0;
        this.lineWidth = 1;

        this.data = null;
        this.dataLoader = new DataLoader.DataLoader(null);

        this.modelsFactory = null;

        //Optional callbacks
        this.onToggled = null;
        this.onSaved = null;
        this.postUrl = null;

        this._init();
    }

    //constructor

    _createClass(VesselsApp2D, [{
        key: 'loadUrl',
        value: function loadUrl(jsonUrl, loadingMessage, progressCallback) {
            return this.dataLoader.loadUrl(jsonUrl, loadingMessage, progressCallback);
        }
    }, {
        key: 'loadData',
        value: function loadData(jsonObj) {
            return this.dataLoader.generateStructuredData(jsonObj);
        }
    }, {
        key: '_init',
        value: function _init() {
            var me = this,
                j = undefined,
                lenJ = undefined,
                mod = undefined;

            //Initialize models factory
            this.modelsFactory = new ModelsFactory.ModelsFactory(this);
        }
    }, {
        key: 'dropFilterChanged',
        value: function dropFilterChanged() {
            var res = this.options.dpis[this._node.dropdwnDp.value].res,
                size = this.options.sizes[this._node.dropdwnSz.value],
                arrLis = undefined,
                k = undefined,
                rws = undefined,
                bayW = undefined,
                dropdwnRw = this._node.dropdwnRw,
                optsPaddingW = this.options.padding.w,
                paddingW = undefined;

            this.width = res * size[this._node.dropdwnOr.value === "1" ? "w" : "h"];
            this.height = res * size[this._node.dropdwnOr.value !== "1" ? "w" : "h"];

            arrLis = [];
            arrLis.push("<option value='1'>" + i18labels.PRINTOPTS_PERROW + ": 1</option>");
            for (k = 2; k < 16; k += 1) {
                bayW = Math.round(this.width / (k * (1 + optsPaddingW)));
                if (bayW < res * 0.3) {
                    break;
                }
                arrLis.push("<option data-w='" + bayW + "' value='" + k + "'>" + i18labels.PRINTOPTS_PERROW + ": " + k + "</option>");
            }
            dropdwnRw.innerHTML = arrLis.join("");
            dropdwnRw.selectedIndex = Math.floor(arrLis.length / 2);
        }
    }, {
        key: 'applyColorsFilter',
        value: function applyColorsFilter(filters) {
            var arrLis = [],
                key = undefined,
                filter = undefined;
            for (key in filters) {
                filter = filters[key];
                arrLis.push("<option value='" + key + "'>" + i18labels.PRINTOPTS_COLORBY + ": " + filter.name + "</option>");
            }
            this._node.dropdwnClr.innerHTML = arrLis.join("");
        }
    }, {
        key: 'toggleHandler',
        value: function toggleHandler(ev) {
            this.toggle(!this.isOpened);
        }
    }, {
        key: 'close',
        value: function close() {
            this.toggle(false);
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            var doOpen = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            this._node.style.display = doOpen ? "block" : "none";
            this.isOpened = doOpen;

            if (!doOpen) {
                if (this.onToggled) {
                    this.onToggled(false);
                }return;
            }

            this._node.divForm.style.display = "block";
            this._node.divProgress.style.display = "none";

            //Populate color options
            this.dropFilterChanged();

            //If callback
            if (this.onToggled) {
                this.onToggled(true);
            }
        }
    }, {
        key: 'launchPdfStart',
        value: function launchPdfStart() {
            var rws = this._node.dropdwnRw.value,
                res = this.options.dpis[this._node.dropdwnDp.value].res,
                filterBy = this._node.dropdwnClr.value,
                w = this.width,
                h = this.height;

            this.pdfStart(rws, res, w, h, filterBy);
        }
    }, {
        key: 'pdfStart',
        value: function pdfStart(rws, res, width, height, filterBy, inchFactor) {
            var me = this,
                aboveBelowSep = this.options.aboveBelowSep,
                data = this.data,
                dataStructured = data.dataStructured,
                hasZeroCell = data.hasZeroCell,
                maxH = undefined,
                maxW = undefined,
                j = undefined,
                lenJ = undefined,
                positionsX = [0],
                bayW = undefined,
                bayH = undefined,
                nextBayH = undefined,
                contHeight = 8,
                contWidth = 8,
                paddingW = undefined,
                optsPaddingW = me.options.padding.w,
                maxCell = undefined,
                cellsWidth = undefined,
                mapCells = {},
                mapTiers = {},
                tierH = 0,
                bayImages = [],
                canvasPage = undefined,
                ctxPage = undefined,
                pageX = undefined,
                pageY = undefined,
                divForm = this._node.divForm,
                divProgress = this._node.divProgress,
                labelsTopHeight = 5,
                labelsLeftWidth = 5,
                boxW = undefined,
                boxH = undefined,
                boxTimesH = undefined,
                boxTop = undefined,
                boxLeft = undefined,
                fontFactor = 1;

            function drawContainer(obj) {
                var inchFactor = arguments.length <= 1 || arguments[1] === undefined ? me.inchFactor : arguments[1];
                var noColor = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

                var canvas = document.createElement("canvas"),
                    ctx = undefined,
                    color = undefined,
                    txt = undefined;

                canvas.width = contWidth * inchFactor;
                canvas.height = contHeight * inchFactor;
                ctx = canvas.getContext("2d");

                if (!noColor) {
                    color = data.filters[filterBy].obs[obj[filterBy]].color;
                    ctx.fillStyle = color;
                    ctx.strokeStyle = __s__.lightenDarkenColor(color, -30);
                } else {
                    ctx.fillStyle = "#ffffff";
                    ctx.strokeStyle = "#666666";
                }

                ctx.lineWidth = 2 * me.lineWidth * inchFactor / me.inchFactor;
                ctx.rect(0, 0, contWidth * inchFactor, contHeight * inchFactor);
                ctx.fill();
                ctx.stroke();

                if (!obj.s) {
                    //Not full
                    txt = "e";
                }
                if (obj.r) {
                    //Reefer
                    txt = "r";
                }

                if (txt) {
                    var calcFactor = fontFactor * inchFactor / me.inchFactor;
                    if (rws < 7) {
                        calcFactor = calcFactor + (8 - rws) * 0.2;
                    }
                    ctx.font = 13 * calcFactor + "px Arial";
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#333333";
                    ctx.fillText(txt, 4 * inchFactor, 7 * inchFactor);
                }

                if (obj.w) {
                    //Hazardous
                    ctx.strokeStyle = "#666666";
                    ctx.lineWidth = 1;
                    ctx.moveTo(0, contHeight * inchFactor / 2);
                    ctx.lineTo(contWidth * inchFactor / 2, 0);
                    ctx.lineTo(contWidth * inchFactor, contHeight * inchFactor / 2);
                    ctx.lineTo(contWidth * inchFactor / 2, contHeight * inchFactor);
                    ctx.lineTo(0, contHeight * inchFactor / 2);
                    ctx.stroke();
                }

                if (obj.h === 9.5) {
                    //High-cube
                    ctx.fillStyle = "#333333";
                    ctx.beginPath();
                    //ctx.rect(5 * inchFactor, 0, 2 * inchFactor, 2 * inchFactor);
                    ctx.moveTo(contWidth * inchFactor * 3 / 4, 0);
                    ctx.lineTo(contWidth * inchFactor, contHeight * inchFactor / 3);
                    ctx.lineTo(contWidth * inchFactor / 2, contHeight * inchFactor / 3);
                    ctx.lineTo(contWidth * inchFactor * 3 / 4, 0);
                    //ctx.lineTo(0, contHeight * inchFactor);
                    //ctx.lineTo(0, contHeight * inchFactor / 2);
                    //ctx.lineTo(0, contHeight * inchFactor / 2);               
                    ctx.fill();
                }

                if (obj.x) {
                    //OOG
                    ctx.fillStyle = "#333333";
                    ctx.beginPath();
                    ctx.arc(contWidth * inchFactor, contHeight * inchFactor / 4 * 3, 2 * inchFactor, 0, 1.5 * Math.PI);
                    ctx.fill();
                }

                switch (obj.l) {//Length
                    case 40:
                        ctx.fillStyle = "#333333";
                        ctx.beginPath();
                        ctx.rect(0, 0, contWidth * inchFactor / 2, 1 * inchFactor);
                        ctx.fill();
                        break;
                    case 45:
                        ctx.moveTo(0, 0);
                        ctx.fillStyle = "#333333";
                        ctx.beginPath();
                        ctx.arc(0, 0, 3 * inchFactor, Math.PI * 2, Math.PI);
                        ctx.fill();
                        break;
                }

                return canvas;
            }

            function drawBay(key) {
                var t = undefined,
                    tier = undefined,
                    c = undefined,
                    cell = undefined,
                    dataBay = dataStructured[key],
                    dataBay2 = undefined,
                    cnv = undefined,
                    ctx = undefined,
                    y = undefined,
                    x = undefined,
                    titleT = key,
                    contWidthCenter = Math.round(contWidth / 2) * me.inchFactor,
                    contHeightFactored = contHeight * me.inchFactor,
                    contWidthFactored = contWidth * me.inchFactor;

                cnv = document.createElement("canvas");
                cnv.width = bayW + labelsLeftWidth * 2 * me.inchFactor;
                cnv.height = maxH * me.inchFactor + labelsTopHeight * 2 * me.inchFactor;
                ctx = cnv.getContext("2d");

                if (dataBay.isBlockStart && dataBay.maxD > 20) {
                    titleT += " (" + __s__.pad(Number(key) + 1, 3) + ")";
                }
                if (!dataBay.isBlockStart) {
                    dataBay2 = dataStructured[__s__.pad(Number(key) - 2, 3)];
                    if (dataBay2.maxD > 20) {
                        titleT += " (" + __s__.pad(Number(key) - 1, 3) + ")";
                    }
                }
                ctx.font = 24 * fontFactor + "px Georgia";
                ctx.textAlign = "center";
                ctx.fillText(titleT, bayW / 2, Math.max(labelsTopHeight / 2 * me.inchFactor, 20));

                ctx.font = 10 * fontFactor + "px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "#666666";
                ctx.strokeStyle = "#dddddd";
                ctx.lineWidth = 2 * me.lineWidth;
                ctx.save();

                console.log("Step 1, Bay " + key);

                //Grid & Numbering
                for (t in mapTiers) {
                    y = (mapTiers[t] - contHeight + labelsTopHeight) * me.inchFactor;
                    ctx.fillText(__s__.pad(t, 2), labelsLeftWidth / 2 * me.inchFactor, (contHeightFactored + 6) / 2 + y);
                    ctx.fillText(__s__.pad(t, 2), (_.max(mapCells) + contWidth + labelsLeftWidth * 1.5) * me.inchFactor, (contHeightFactored + 6) / 2 + y);
                }
                for (c in mapCells) {
                    x = (mapCells[Number(c)] + labelsLeftWidth) * me.inchFactor;
                    ctx.fillText(__s__.pad(c, 2), contWidthCenter + x, (_.min(mapTiers) - labelsTopHeight * 1.5) * me.inchFactor);
                    ctx.fillText(__s__.pad(c, 2), contWidthCenter + x, (_.max(mapTiers) + labelsTopHeight * 1.5) * me.inchFactor);
                    for (t in mapTiers) {
                        y = (mapTiers[t] - contHeight + labelsTopHeight) * me.inchFactor;
                        ctx.rect(x, y, contWidthFactored, contHeightFactored);
                        ctx.stroke();
                    }
                }

                //Containers info
                for (c in dataBay.cells) {
                    cell = dataBay.cells[c];
                    for (t in cell.tiers) {
                        x = (mapCells[Number(c)] + labelsLeftWidth) * me.inchFactor;
                        y = (mapTiers[Number(t)] - contHeight + labelsTopHeight) * me.inchFactor;
                        var cnt = drawContainer(cell.tiers[t]);
                        ctx.drawImage(cnt, x, y);
                    }
                }

                //Add even bays if not blockStart
                if (!dataBay.isBlockStart) {
                    dataBay = dataStructured[__s__.pad(Number(key) - 2, 3)];
                    if (dataBay) {

                        for (c in dataBay.cells) {
                            cell = dataBay.cells[c];
                            for (t in cell.tiers) {
                                if (cell.tiers[t].iBay & 1) {
                                    continue;
                                }
                                x = (mapCells[Number(c)] + labelsLeftWidth) * me.inchFactor;
                                y = (mapTiers[Number(t)] - contHeight + labelsTopHeight) * me.inchFactor;
                                var cnt = drawContainer(cell.tiers[t]);
                                ctx.drawImage(cnt, x, y);
                            }
                        }
                    }
                }

                return cnv;
            }

            function drawLegend() {
                var f = undefined,
                    cnv = undefined,
                    ctx = undefined,
                    x = 0,
                    y = 0,
                    xInit = Math.round(6 * me.inchFactor),
                    yInit = Math.round(labelsTopHeight * me.inchFactor * 2),
                    yAdd = Math.round(14 * me.inchFactor),
                    xPad = Math.round(20 * me.inchFactor),
                    maxX = 0,
                    obs = undefined,
                    obj = undefined;

                cnv = document.createElement("canvas");
                cnv.width = bayW + labelsLeftWidth * 2 * me.inchFactor;
                cnv.height = maxH * me.inchFactor + labelsTopHeight * 2 * me.inchFactor;
                ctx = cnv.getContext("2d");

                ctx.font = 19 * fontFactor + "px Arial";
                ctx.textAlign = "left";
                ctx.fillStyle = "#444444";

                y = yInit;
                x = xInit;
                for (f in data.filters[filterBy].obs) {
                    obs = data.filters[filterBy].obs[f];
                    obj = { s: 1 };
                    obj[filterBy] = f;
                    ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6), x, y);
                    ctx.fillText(f, x + 16 * me.inchFactor, y + 8 * me.inchFactor);
                    maxX = Math.round(Math.max(maxX, ctx.measureText(f).width));
                    y += yAdd;
                    if (y + yAdd > cnv.height) {
                        y = yInit;x += xInit + xPad + maxX;
                    }
                }

                y = yInit;x += xInit + xPad + maxX;

                //Add Hazardous
                obj = { s: 1, w: 1 };
                obj[filterBy] = "";
                ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
                ctx.fillText("Hazardous", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
                y += yAdd;

                //Add Empty
                obj = { s: 0 };
                obj[filterBy] = "";
                ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
                ctx.fillText("Empty", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
                y += yAdd;

                //Add Reefer
                obj = { s: 1, r: 1 };
                obj[filterBy] = "";
                ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
                ctx.fillText("Reefer", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
                y += yAdd;

                //Add High-cube
                obj = { s: 1, h: 9.5 };
                obj[filterBy] = "";
                ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
                ctx.fillText("High-cube", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
                y += yAdd;

                //Add 40-footer
                obj = { s: 1, l: 40 };
                obj[filterBy] = "";
                ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
                ctx.fillText("40-footer", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
                y += yAdd;

                //Add 45-footer
                obj = { s: 1, l: 45 };
                obj[filterBy] = "";
                ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
                ctx.fillText("45-footer", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
                y += yAdd;

                //Add OOG
                obj = { s: 1, x: 1 };
                obj[filterBy] = "";
                ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
                ctx.fillText("OOG", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
                y += yAdd;

                return cnv;
            }

            function sendPagesToServer() {
                var postUrl = me.postUrl,
                    reqUpload = undefined,
                    json = undefined,
                    isLndscp = undefined,
                    j = undefined,
                    lenJ = undefined,
                    ajaxError = function ajaxError(err) {
                    console.error(err);
                    if (divProgress) {
                        divProgress.innerHTML = "An error has ocurred.";
                    }
                },
                    handlerUpload = function handlerUpload(e) {
                    if (e.lengthComputable) {
                        var percentage = Math.round(e.loaded * 100 / e.total);
                        divProgress.innerHTML = e.loaded < e.total ? percentage + "%" : "Finishing, please wait...";
                    }
                };

                //Serialize data
                isLndscp = me._node.dropdwnOr.value === "0";
                json = {
                    title: me.title,
                    numImages: bayImages.length,
                    pageSize: me.options.sizes[me._node.dropdwnSz.value].name,
                    pageSizeW: me.options.sizes[me._node.dropdwnSz.value][isLndscp ? "h" : "w"],
                    pageSizeH: me.options.sizes[me._node.dropdwnSz.value][isLndscp ? "w" : "h"] - 1,
                    pageOrientation: !isLndscp ? "P" : "L",
                    filterBy: i18labels.PRINTOPTS_COLORBY + ": " + data.filters[filterBy].name
                };
                for (j = 0, lenJ = bayImages.length; j < lenJ; j += 1) {
                    json["page_" + j] = bayImages[j].toDataURL("image/png");
                }
                //console.log(json);

                //Send it to server
                reqUpload = jQuery.ajax({
                    url: postUrl,
                    type: "POST",
                    data: json,
                    timeout: 7200000 //2 hours
                });

                if (divProgress) {
                    reqUpload.uploadProgress(handlerUpload);
                }

                reqUpload.fail(ajaxError);
                reqUpload.done(function (result) {
                    console.log(result);
                    if (result.download) {
                        divProgress.innerHTML = "<a href='" + result.download + "' target='_blank'>Download PDF</a>";
                    } else {
                        divProgress.innerHTML = "An error has ocurred.";
                    }
                });
            }

            function receivePdfFromServer(res) {}

            //Show progress
            if (divForm) {
                divForm.style.display = "none";
            }
            if (divProgress) {
                divProgress.style.display = "block";
                divProgress.innerHTML = i18labels.PRINTOPTS_PAGEPROGRESS;
            }

            maxH = (data.belowTiers.n + data.aboveTiers.n) * contHeight + aboveBelowSep * 2 + 2 * labelsTopHeight;
            maxW = data.maxWidth * contWidth + 2 * labelsLeftWidth;
            bayW = Math.floor(width / (rws * (1 + optsPaddingW)));
            paddingW = Math.floor(bayW * optsPaddingW);

            //Line width (depends on the resolution)
            this.lineWidth = Math.round(res / 300);

            //Pixels per inch factor
            this.inchFactor = bayW / maxW; // (1 / Math.max(maxH / height, maxW / bayW));
            fontFactor = res / 300;

            //Positions in pixels for each Bay
            for (j = 1; j < rws; j += 1) {
                positionsX[j] = positionsX[j - 1] + bayW + paddingW;
            }

            //Bay dimensions
            bayH = (maxH + contHeight) * this.inchFactor;
            nextBayH = bayH + me.options.padding.h * this.inchFactor;
            boxW = bayW * rws + paddingW * (rws - 1);

            boxTimesH = Math.min(Math.floor(height / nextBayH), Math.ceil(data.dataStructuredKeysArr.length / rws));
            boxH = boxTimesH * bayH + (boxTimesH - 1) * me.options.padding.h * this.inchFactor;

            boxTop = Math.round((height - boxH) / 2);
            boxLeft = Math.round((width - boxW) / 2);

            //console.log("Dimensions", { bayW, bayH, nextBayH, boxW, boxH, boxLeft, boxTop });

            //Cells positions
            maxCell = Number(_.max(data.dataStructured, function (k) {
                return k.maxCell;
            }).maxCell);
            cellsWidth = (maxCell + (hasZeroCell ? 1 : 0)) * contWidth;
            var lPos = 0,
                rPos = cellsWidth - contWidth;
            for (j = maxCell, lenJ = hasZeroCell ? 0 : 1; j >= lenJ; j -= 1) {
                if (j % 2 === 0) {
                    mapCells[j] = lPos;
                    lPos += contWidth;
                } else {
                    mapCells[j] = rPos;
                    rPos -= contWidth;
                }
            }

            //Tiers positions
            tierH = 0;
            for (j = data.iTierMin, lenJ = data.iTierMax; j <= lenJ; j += 2) {
                mapTiers[j] = maxH - tierH;
                tierH += contHeight;
            }
            tierH += aboveBelowSep * 2;
            for (j = data.iTierMinAbove, lenJ = data.iTierMaxAbove; j <= lenJ; j += 2) {
                mapTiers[j] = maxH - tierH;
                tierH += contHeight;
            }

            //Prepare 1st page
            canvasPage = document.createElement("canvas");
            canvasPage.width = width;canvasPage.height = height;
            ctxPage = canvasPage.getContext("2d");
            pageY = 0;

            setTimeout(function () {
                //Iterate bays & pages
                for (var _j = 0, _lenJ = data.dataStructuredKeysArr.length; _j < _lenJ; _j += 1) {
                    var bayInfo = data.dataStructuredKeysArr[_j];
                    if (!bayInfo) {
                        continue;
                    }

                    var im = drawBay(data.dataStructuredKeysArr[_j]);
                    ctxPage.drawImage(im, positionsX[_j % rws] + boxLeft, pageY + boxTop);

                    if ((_j + 1) % rws === 0 || _j + 1 === _lenJ) {
                        pageY += nextBayH;
                        if (pageY + nextBayH > height || _j + 1 === _lenJ) {

                            bayImages.push(canvasPage);

                            if (_j + 1 < _lenJ) {
                                canvasPage = document.createElement("canvas");
                                canvasPage.width = width;canvasPage.height = height;
                                ctxPage = canvasPage.getContext("2d");
                                pageY = 0;
                            } else {
                                if ((_j + 1) % rws !== 0) {
                                    pageY -= nextBayH;
                                }
                                ctxPage.drawImage(drawLegend(), Math.round(positionsX[(_j + 1) % rws] + boxLeft), Math.round(pageY + boxTop));
                            }
                        }
                    }
                }

                divProgress.innerHTML = i18labels.PRINTOPTS_SENDINGPAGES;
                sendPagesToServer();
            }, 50);

            window.pagess = bayImages;
        }
    }, {
        key: 'setTitle',
        value: function setTitle(vessel, departure, voyage) {
            var title = (vessel ? vessel : "") + (departure ? " / " + departure : "") + (voyage ? " / " + voyage : "");

            if (title) {
                this.title = title;
            }
        }
    }]);

    return VesselsApp2D;
})();

exports.VesselsApp2D = VesselsApp2D;

},{"../utils/dom-utilities.js":7,"../utils/js-helpers.js":8,"../utils/preloader.js":9,"./data-loader.js":3,"./i18labels.js":4,"./models-factory.js":5}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var isInputOrTextarea = function isInputOrTextarea(input) {
    return input && input.tagName && (input.tagName.toLowerCase() === "textarea" || input.tagName.toLowerCase() === "input" && input.type.toLowerCase() === "text");
};

exports.isInputOrTextarea = isInputOrTextarea;
var isHtmlNode = function isHtmlNode(input) {
    return typeof HTMLElement === "object" ? id instanceof HTMLElement : typeof id === "object" && id.nodeType === 1 && typeof id.nodeName === "string";
};

exports.isHtmlNode = isHtmlNode;
var addEventLnr = function addEventLnr(obj, type, fn) {
    if (window.attachEvent) {
        obj["e" + type + fn] = fn;
        obj[type + fn] = function () {
            obj["e" + type + fn](window.event);
        };
        obj.attachEvent("on" + type, obj[type + fn]);
    } else {
        obj.addEventListener(type, fn, false);
    }
};

exports.addEventLnr = addEventLnr;
var addEventDsptchr = function addEventDsptchr(eName) {
    if (window.Event && typeof window.Event === "function") {
        return new Event(eName);
    } else {
        var _event = document.createEvent('Event');
        _event.initEvent(eName, true, true);
        return _event;
    }
};
exports.addEventDsptchr = addEventDsptchr;

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.callOnCondition = callOnCondition;
exports.lightenDarkenColor = lightenDarkenColor;
var isArray = function isArray(c) {
    return Array.isArray ? Array.isArray(c) : c instanceof Array;
};

exports.isArray = isArray;
var extend = function extend(base, newObj) {
    var key = undefined,
        obj = JSON.parse(JSON.stringify(base));

    if (newObj) {
        for (key in newObj) {
            if (Object.prototype.hasOwnProperty.call(newObj, key) && Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = newObj[key];
            }
        }
    }
    return obj;
};

exports.extend = extend;
var sortNumeric = function sortNumeric(a, b) {
    return a - b;
};

exports.sortNumeric = sortNumeric;
var trimString = function trimString(s) {
    var start = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
    var end = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

    var sTrimmed = s;
    if (start) {
        sTrimmed = sTrimmed.replace(/^\s\s*/, '');
    }
    if (end) {
        sTrimmed = sTrimmed.replace(/\s\s*$/, '');
    }
    return sTrimmed;
};

exports.trimString = trimString;
var arrayToSet = function arrayToSet(arr) {
    var j = undefined,
        lenJ = undefined,
        outputSet = new Set();
    for (j = 0, lenJ = arr.length; j < lenJ; j += 1) {
        var clazzName = trimString(arr[j]);
        if (!outputSet.has(clazzName)) {
            outputSet.add(clazzName);
        }
    }
    return ouputSet;
};

exports.arrayToSet = arrayToSet;
var objKeysToArray = function objKeysToArray(obj, sortN) {
    var key = undefined,
        arr = [];
    for (key in obj) {
        arr.push(key);
    }
    if (sortN) {
        arr = arr.sort(sortNumeric);
    }
    return arr;
};

exports.objKeysToArray = objKeysToArray;
var decimalToHex = function decimalToHex(d) {
    var hex = Number(d).toString(16);
    hex = "000000".substr(0, 6 - hex.length) + hex;
    return hex.toUpperCase();
};

exports.decimalToHex = decimalToHex;
var pad = function pad(num, size) {
    var s = "000" + String(num);
    return s.substr(s.length - size);
};

exports.pad = pad;
var getQueryParams = function getQueryParams() {
    var qs = document.location.search.split('+').join(' '),
        params = {},
        tokens = undefined,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
};

exports.getQueryParams = getQueryParams;

function callOnCondition(condition, ifTrueCall, ifFalseCall) {
    if (condition) {
        ifTrueCall.apply(null, arguments);
    } else {
        ifFalseCall.apply(null, arguments);
    }
}

;

function lightenDarkenColor(col, amt) {
    var usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }

    var num = parseInt(col, 16);

    var r = (num >> 16) + amt;

    if (r > 255) r = 255;else if (r < 0) r = 0;

    var b = (num >> 8 & 0x00FF) + amt;

    if (b > 255) b = 255;else if (b < 0) b = 0;

    var g = (num & 0x0000FF) + amt;

    if (g > 255) g = 255;else if (g < 0) g = 0;

    return (usePound ? "#" : "") + (g | b << 8 | r << 16).toString(16);
}

;

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _default = (function () {
    function _default(node, textNode, radius, opts, imgName, initialMessage) {
        if (node === undefined) node = mandatory();

        _classCallCheck(this, _default);

        var canv = undefined;

        if (node === null || node === undefined) {
            return;
        }

        this.node = node;
        canv = document.createElement("canvas");

        this.messages = textNode;
        this.canv = canv;
        this.ctx = canv.getContext("2d");
        this.loadCurrent = 0;
        this.radius = radius;

        this.canv.width = Math.round(radius * 2);
        this.canv.height = Math.round(radius * 2);
        this.setPixelRatio();

        this.opts = opts;
        this.node.appendChild(canv);

        this.image = imgName ? document.getElementById(imgName) : null;
        if (initialMessage) {
            this.setMessage(initialMessage);
        }
    }

    _createClass(_default, [{
        key: "rectLoader",
        value: function rectLoader() {
            var per = this.loadCurrent,
                ctx = this.ctx,
                cen = this.radius,
                cenDouble = cen * 2,
                cenHalf = Math.round(cen / 2),
                angle = per * 2 * Math.PI,
                options = this.opts;

            ctx.clearRect(0, 0, cenDouble, cenDouble);

            ctx.beginPath();
            ctx.arc(cen, cen, cenHalf, 0, 2 * Math.PI, false);
            ctx.fillStyle = options.loaderColor;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = options.loaderColor;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cen, cen, Math.round(cenHalf / 2), 0, angle, false);
            ctx.lineWidth = cenHalf;
            ctx.strokeStyle = options.loaderColorSucess;
            ctx.stroke();

            if (this.image) {
                ctx.drawImage(this.image, cenHalf, cenHalf, cen, cen);
            }
        }
    }, {
        key: "setPixelRatio",
        value: function setPixelRatio() {

            var oldWidth = undefined,
                oldHeight = undefined,
                ctx = this.ctx,
                devicePixelRatio = window.devicePixelRatio || 1,
                backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1,
                ratio = devicePixelRatio / backingStoreRatio;

            if (devicePixelRatio !== backingStoreRatio) {

                oldWidth = this.canv.width;
                oldHeight = this.canv.height;

                this.canv.width = oldWidth * ratio;
                this.canv.height = oldHeight * ratio;

                this.canv.style.width = oldWidth + "px";
                this.canv.style.height = oldHeight + "px";

                this.ctx.scale(ratio, ratio);
            }
        }
    }, {
        key: "setMessage",
        value: function setMessage(message) {
            var isError = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            if (this.messages) {
                this.messages.innerHTML = message;
                this.messages.style.color = isError ? "red" : "";
            }
        }
    }, {
        key: "updateLoader",
        value: function updateLoader(per, speed) {
            var me = this;
            if (!me.node) {
                return;
            }
            TweenLite.to(me, speed, {
                loadCurrent: per,
                ease: Power1.easeInOut,
                onUpdate: me.rectLoader,
                onUpdateScope: me
            });
        }
    }, {
        key: "startAnimation",
        value: function startAnimation() {
            if (!this.node) {
                return;
            }
            this.rectLoader();
            this.updateLoader(0.4, 2);
        }
    }, {
        key: "stopAnimation",
        value: function stopAnimation() {
            if (!this.node) {
                return;
            }
            this.updateLoader(1, 0.25);
        }
    }, {
        key: "setPercentage",
        value: function setPercentage(per) {
            if (!this.node) {
                return;
            }
            this.loadCurrent = per;
            this.rectLoader();
        }
    }, {
        key: "show",
        value: function show() {
            if (!this.node) {
                return;
            }
            this.node.style.display = "block";
        }
    }, {
        key: "hide",
        value: function hide() {
            if (!this.node) {
                return;
            }
            this.node.style.display = "none";
        }
    }], [{
        key: "mandatory",
        value: function mandatory() {
            throw new Error('Missing parameter');
        }
    }]);

    return _default;
})();

exports["default"] = _default;
module.exports = exports["default"];

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RColor = (function () {
    function RColor() {
        _classCallCheck(this, RColor);

        this.hue = Math.random(), this.goldenRatio = 0.618033988749895;
        this.hexwidth = 2;
    }

    _createClass(RColor, [{
        key: "hsvToRgb",
        value: function hsvToRgb(h, s, v) {
            var h_i = Math.floor(h * 6),
                f = h * 6 - h_i,
                p = v * (1 - s),
                q = v * (1 - f * s),
                t = v * (1 - (1 - f) * s),
                r = 255,
                g = 255,
                b = 255;
            switch (h_i) {
                case 0:
                    r = v, g = t, b = p;break;
                case 1:
                    r = q, g = v, b = p;break;
                case 2:
                    r = p, g = v, b = t;break;
                case 3:
                    r = p, g = q, b = v;break;
                case 4:
                    r = t, g = p, b = v;break;
                case 5:
                    r = v, g = p, b = q;break;
            }
            return [Math.floor(r * 256), Math.floor(g * 256), Math.floor(b * 256)];
        }
    }, {
        key: "padHex",
        value: function padHex(str) {
            if (str.length > this.hexwidth) return str;
            return new Array(this.hexwidth - str.length + 1).join('0') + str;
        }
    }, {
        key: "get",
        value: function get(hex, saturation, value) {
            this.hue += this.goldenRatio;
            this.hue %= 1;
            if (typeof saturation !== "number") {
                saturation = 0.5;
            }
            if (typeof value !== "number") {
                value = 0.95;
            }
            var rgb = this.hsvToRgb(this.hue, saturation, value);
            if (hex) {
                return "#" + this.padHex(rgb[0].toString(16)) + this.padHex(rgb[1].toString(16)) + this.padHex(rgb[2].toString(16));
            } else {
                return rgb;
            }
        }
    }]);

    return RColor;
})();

exports.RColor = RColor;

},{}]},{},[1]);
