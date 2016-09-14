(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var scene = require('../core/vessels-3d.js');
var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');
var i18labels = require('../core/i18labels.js');

var node = document.getElementById("app-3d"),
    titleNode = document.getElementById("titleH1"),
    bayNode = document.getElementById("titleBay"),
    infoNode = document.getElementById("info-window"),
    queryParams = __s__.getQueryParams(),
    app3d,
    data,
    controlsControl;

controlsControl = {
    dropFilter: null,
    dropFilterValue: null,
    showWireframes: null,
    currentlyHidden: [],
    latestFilter: "",
    dropBays: null,
    dropBaysDictionary: {},
    dropAddHouse: null,
    openBayInfo: null,
    closeBayInfo: null,
    bayInfo: null,
    bayInfoTable: null,
    baySelected: "",
    shipHouseSpace: 20.5,
    isExpanded: false,
    prevnextCont: null,
    prevnextNum: 1,
    numContsByBlock: null,
    hatchDecksVisible: true,

    init: function init() {
        var ctrlColors = document.getElementById("dropColors"),
            ctrlFilter = document.getElementById("dropFilter"),
            j = undefined,
            opt = undefined,
            me = controlsControl,
            filters = app3d.data.filters;

        me.dropFilterValue = document.getElementById("dropFilterValue");
        me.showWireframes = document.getElementById("showWireframesFiltered");
        me.expandViewBtn = document.getElementById("expandView");
        me.prevnextCont = document.getElementById("prevnext-container");
        me.dropFilter = ctrlFilter;
        me.checkboxHatchCovers = document.getElementById("view-hcs");

        opt = document.createElement("option");
        opt.value = "";opt.innerHTML = "None";
        ctrlFilter.appendChild(opt);

        for (j in filters) {
            opt = document.createElement("option");
            opt.value = j;opt.innerHTML = filters[j].name;
            ctrlFilter.appendChild(opt);

            opt = document.createElement("option");
            opt.value = j;opt.innerHTML = filters[j].name;
            ctrlColors.appendChild(opt);
        }
        ctrlColors.value = "i";

        __d__.addEventLnr(ctrlFilter, "change", me.prepareFilter);
        __d__.addEventLnr(me.dropFilterValue, "change", me.processFilterValue);
        __d__.addEventLnr(ctrlColors, "change", me.colorize);
        __d__.addEventLnr(me.showWireframes, "change", me.listenWireframeDisplay);
        __d__.addEventLnr(window, "keydown", me.checkKeyPressed);
        __d__.addEventLnr(me.expandViewBtn, "change", me.expandView);
        __d__.addEventLnr(me.checkboxHatchCovers, "change", me.toggleHatchCovers);

        __d__.addEventLnr(document.getElementById("bay-next"), "click", me.expandViewNext);
        __d__.addEventLnr(document.getElementById("bay-prev"), "click", me.expandViewPrev);

        me.addBaysControl();
        me.addHouseControl();
        me.pauseControls(false);
    },

    addBaysControl: function addBaysControl() {
        var key,
            j,
            lenJ,
            bayGroup,
            dropBays = document.getElementById("dropBays"),
            bays = [],
            oddB,
            prevOddExists,
            nextOddExists,
            oneOddExists,
            me = controlsControl,
            iBay,
            g3Bays = app3d.renderer3d.g3Bays,
            dataStructured = app3d.data.dataStructured,
            lis = ["<option value=''>All bays</option>"];

        function changeBay(ev) {
            var v = ev.target.value;
            me.isolateBay(v);
        }

        for (key in g3Bays) {
            bayGroup = g3Bays[key];
            if (bayGroup.children.length > 0) bays.push(bayGroup.name.replace("b", ""));
        }

        bays = bays.sort(__s__.sortNumeric);
        for (j = 0, lenJ = bays.length; j < lenJ; j += 1) {
            iBay = Number(bays[j]);
            oddB = iBay % 2 === 1;
            if (oddB) {
                if (dataStructured[bays[j]].n) {
                    lis.push("<option value='" + bays[j] + "'>" + bays[j] + "</option>");
                    me.dropBaysDictionary[bays[j]] = bays[j];
                }
            } else {
                prevOddExists = j + 1 < lenJ && Number(bays[j + 1]) === iBay + 1;
                if (!prevOddExists && !me.dropBaysDictionary[__s__.pad(iBay - 1, 3)]) {
                    lis.push("<option value='" + __s__.pad(iBay, 3) + "'>" + __s__.pad(iBay - 1, 3) + "</option>");
                    me.dropBaysDictionary[__s__.pad(iBay - 1, 3)] = __s__.pad(iBay, 3);
                }
            }
        }

        dropBays.innerHTML = lis.join("");
        me.dropBays = dropBays;
        __d__.addEventLnr(me.dropBays, "change", changeBay);

        me.openBayInfo = document.getElementById("open-panel");
        me.closeBayInfo = document.getElementById("close-panel");
        me.bayInfo = document.getElementById("bay-panel");
        me.bayInfoTable = document.getElementById("bay-table-container");

        __d__.addEventLnr(me.openBayInfo, "click", me.showBayInfo);
        __d__.addEventLnr(me.closeBayInfo, "click", me.showBayInfo);
        me.openBayInfo.style.left = "-300px";
    },

    addHouseControl: function addHouseControl() {
        var me = controlsControl,
            dropAddHouse = document.getElementById("dropAddHouse"),
            dataStructured = app3d.data.dataStructured,
            key,
            bays,
            j,
            lenJ,
            lis = ["<option value=''>No house</option>"];

        bays = __s__.objKeysToArray(me.dropBaysDictionary);
        bays = bays.sort(__s__.sortNumeric);
        for (j = bays.length - 1; j >= 0; j -= 1) {
            key = bays[j];
            if (dataStructured[key].maxD > 20) {
                lis.push("<option value='" + me.dropBaysDictionary[key] + "'>before " + key + "</option>");
            }
        }

        dropAddHouse.innerHTML = lis.join("");
        __d__.addEventLnr(dropAddHouse, "change", me.moveShipHouseLnr);
        me.dropAddHouse = dropAddHouse;
    },

    prepareFilter: function prepareFilter(e) {
        var v = e.target.value,
            key,
            currentFilter,
            opts = ["<option value=''>No filter</option>"],
            me = controlsControl,
            filters = app3d.data.filters;

        if (!v) {
            me.pauseControls(true);
            me.showHiddenMeshes();
            me.pauseControls(false);
            me.dropFilterValue.value = "";
            me.dropFilterValue.innerHTML = opts.join("");
            me.dropFilterValue.setAttribute("disabled", "disabled");
            return;
        }

        if (me.latestFilter !== v) {
            me.pauseControls(true);
            me.showHiddenMeshes();
            me.pauseControls(false);
        }

        me.latestFilter = v;
        me.dropFilterValue.removeAttribute("disabled");
        me.dropFilterValue.innerHTML = "";
        currentFilter = filters[v];

        if (currentFilter.tf) {
            opts.push("<option value='1'>yes</option>");
            opts.push("<option value='0'>no</option>");
        } else {
            for (key in currentFilter.obs) {
                opts.push("<option value='" + key + "'>" + key + "</option>");
            }
        }
        me.dropFilterValue.innerHTML = opts.join("");
    },

    processFilterValue: function processFilterValue(e) {
        var v = e.target.value,
            me = controlsControl,
            filter = me.dropFilter,
            j,
            lenJ,
            key,
            showWireframes = me.showWireframes.checked,
            filters = app3d.data.filters,
            allContainerMeshesObj = app3d.data.allContainerMeshesObj,
            currentlyHidden = [],
            newFilterIndexes,
            mesh;

        me.pauseControls(true);
        me.showHiddenMeshes();
        if (v === "") {
            me.pauseControls(false);return;
        }

        newFilterIndexes = filters[me.dropFilter.value].obs;
        for (key in newFilterIndexes) {
            if (me.dropFilterValue.value === key) {
                continue;
            }
            for (j = 0, lenJ = newFilterIndexes[key].indexes.length; j < lenJ; j += 1) {
                mesh = allContainerMeshesObj[newFilterIndexes[key].indexes[j].c];
                if (showWireframes) {
                    mesh.isBasic = true;
                    mesh.material = app3d.renderer3d.basicMaterial;
                } else {
                    mesh.visible = false;
                }
                currentlyHidden.push(newFilterIndexes[key].indexes[j].c);
            }
        }

        me.currentlyHidden = currentlyHidden;
        me.pauseControls(false);
    },

    processWireframeDisplay: function processWireframeDisplay(toWireframes) {
        var me = controlsControl,
            currentlyHidden = me.currentlyHidden,
            j,
            mesh,
            allContainerMeshesObj = app3d.data.allContainerMeshesObj,
            lenJ = currentlyHidden.length;

        if (lenJ) {
            for (j = 0; j < lenJ; j += 1) {
                mesh = allContainerMeshesObj[currentlyHidden[j]];
                if (toWireframes) {
                    mesh.isBasic = true;
                    mesh.material = app3d.renderer3d.basicMaterial;
                    mesh.visible = true;
                } else {
                    mesh.visible = false;
                }
            }
        }
    },

    listenWireframeDisplay: function listenWireframeDisplay(ev) {
        var v = ev.target.checked,
            me = controlsControl;

        me.pauseControls(true);
        me.processWireframeDisplay(v);
        me.pauseControls(false);
    },

    showHiddenMeshes: function showHiddenMeshes() {
        var currentlyHidden = controlsControl.currentlyHidden,
            j,
            mesh,
            lenJ = currentlyHidden.length,
            allContainerMeshesObj = app3d.data.allContainerMeshesObj;

        if (lenJ > 0) {
            for (j = 0; j < lenJ; j += 1) {
                mesh = allContainerMeshesObj[currentlyHidden[j]];
                if (mesh.isBasic) {
                    mesh.material = app3d.renderer3d.allMaterials[mesh.materialPos];
                    mesh.isBasic = false;
                }
                mesh.visible = true;
            }
        }
        controlsControl.currentlyHidden = [];
    },

    pauseControls: function pauseControls(disable) {
        var me = controlsControl,
            prevAttr;

        if (disable) {
            prevAttr = me.dropFilterValue.getAttribute("disabled");
            me.dropFilter.setAttribute("disabled", "disabled");
            me.dropFilterValue.setAttribute("disabled", "disabled");
            me.dropFilterValue.setAttribute("prevAttr", prevAttr);
            me.showWireframes.setAttribute("disabled", "disabled");
            me.dropBays.setAttribute("disabled", "disabled");
            me.dropAddHouse.setAttribute("disabled", "disabled");
            return;
        }
        //else
        prevAttr = me.dropFilterValue.getAttribute("prevAttr");
        me.dropFilter.removeAttribute("disabled");
        if (prevAttr !== "disabled") {
            me.dropFilterValue.removeAttribute("disabled");
        }
        me.showWireframes.removeAttribute("disabled");

        if (!me.isExpanded) {
            me.dropBays.removeAttribute("disabled");
            me.dropAddHouse.removeAttribute("disabled");
        }
    },

    colorize: function colorize(e) {
        var v = e.target.value,
            j,
            lenJ,
            mesh,
            obj,
            allContainerMeshesObj = app3d.data.allContainerMeshesObj,
            filters = app3d.data.filters,
            data = app3d.data.data;

        controlsControl.showColorsTable(v);

        for (j = 0, lenJ = data.info.contsL; j < lenJ; j += 1) {
            obj = data.conts[j];
            mesh = allContainerMeshesObj[obj.cDash];
            mesh.materialPos = filters[v].obs[obj[v]].materialPos;
            if (!mesh.isBasic) {
                mesh.material = app3d.renderer3d.allMaterials[mesh.materialPos];
            }
        }
    },

    isolateBay: function isolateBay(sBay) {
        var force = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        var me = controlsControl,
            iBay = Number(sBay),
            sepZ = 40,
            topY = 500,
            newZ,
            dataStructured = app3d.data.dataStructured,
            filters = app3d.data.filters,
            g3Bays = app3d.renderer3d.g3Bays,
            shipHouse = app3d.renderer3d.shipHouse;

        function generateTable(bayToAnimate) {
            var keyCell,
                keyTier,
                iBaseBay,
                cell,
                ob,
                iEvenBay,
                tableBase,
                tableExtraBase,
                cells,
                tiers,
                maxCell,
                tiersAcc = {},
                sBay,
                sExtraBay,
                isEven = false,
                j,
                lenJ,
                k,
                dat,
                htmlArr,
                htmlTable,
                htmlRow,
                htmlCell;

            function createThTable() {
                var htmlRow = document.createElement("tr");
                for (k = 0; k <= maxCell; k += 1) {
                    dat = __s__.pad(k, 2);
                    htmlCell = document.createElement("th");
                    htmlCell.innerHTML = dat;
                    k % 2 === 0 ? htmlRow.appendChild(htmlCell) : htmlRow.insertBefore(htmlCell, htmlRow.firstChild);
                }
                htmlRow.insertBefore(document.createElement("th"), htmlRow.firstChild);
                htmlRow.appendChild(document.createElement("th"));
                return htmlRow;
            }

            /*
            iBaseBay = (bayToAnimate - 1) % 4 === 0 ? bayToAnimate : bayToAnimate - 2;*/
            iBaseBay = bayToAnimate;
            if (iBaseBay % 2 === 0) {
                isEven = true;iBaseBay -= 1;
            }

            iEvenBay = bayToAnimate - 1;
            if (!g3Bays["b" + __s__.pad(iEvenBay, 3)]) {
                iEvenBay += 2;
            }
            if (!g3Bays["b" + __s__.pad(iEvenBay, 3)]) {
                iEvenBay = 0;
            }

            sBay = __s__.pad(iBaseBay, 3);
            sExtraBay = __s__.pad(bayToAnimate, 3);
            tableBase = JSON.parse(JSON.stringify(dataStructured[sBay])); //deep copy

            if (iBaseBay !== bayToAnimate) {
                //Mid bay like 3, 7, 11,...
                tableExtraBase = JSON.parse(JSON.stringify(dataStructured[sExtraBay])); //deep copy
                //Remove
                for (keyCell in tableBase.cells) {
                    cell = tableBase.cells[keyCell];
                    for (keyTier in cell.tiers) {
                        ob = cell.tiers[keyTier];
                        if (ob.p.indexOf(sBay) === 0) {
                            tableBase.cells[keyCell].tiers[keyTier] = null;
                        }
                    }
                }
                //Replace
                for (keyCell in tableExtraBase.cells) {
                    cell = tableExtraBase.cells[keyCell];
                    for (keyTier in cell.tiers) {
                        ob = cell.tiers[keyTier];
                        if (ob.p.indexOf(sExtraBay) === 0) {
                            if (!tableBase.cells[keyCell]) {
                                tableBase.cells[keyCell] = { tiers: {} };
                            }
                            tableBase.cells[keyCell].tiers[keyTier] = ob;
                        }
                    }
                }
            }

            //Find all tiers
            for (keyCell in tableBase.cells) {
                for (keyTier in tableBase.cells[keyCell].tiers) {
                    if (!tiersAcc[keyTier]) {
                        tiersAcc[keyTier] = 1;
                    }
                }
            }

            cells = __s__.objKeysToArray(tableBase.cells, true);
            tiers = __s__.objKeysToArray(tiersAcc, true);
            maxCell = Number(cells[cells.length - 1]);

            htmlTable = document.createElement("table");
            htmlTable.setAttribute("align", "center");
            htmlRow = createThTable();
            htmlTable.appendChild(htmlRow);

            for (j = tiers.length - 1; j >= 0; j -= 1) {
                htmlRow = document.createElement("tr");
                htmlRow.setAttribute("data-tier", tiers[j]);
                htmlTable.appendChild(htmlRow);

                for (k = 0; k <= maxCell; k += 1) {
                    dat = __s__.pad(k, 2);
                    htmlCell = document.createElement("td");
                    htmlCell.id = "td_" + dat + "_" + tiers[j];
                    if (tableBase.cells[dat] && tableBase.cells[dat].tiers[tiers[j]]) {
                        ob = tableBase.cells[dat].tiers[tiers[j]];
                        htmlArr = [];
                        htmlArr.push(ob.s ? "F <br />" : "e <br />");
                        htmlArr.push("<span class='dest' style='background:" + filters.d.obs[ob.d].color + "'>" + ob.d + "</span><br />");
                        htmlArr.push("<span class='haz " + (ob.w ? "isHaz" : "") + "'>" + (ob.w ? "HAZARDOUS" : "") + "</span>");
                        htmlArr.push("<span class='cont'>" + ob.c.substr(0, 4) + "<br />" + ob.c.substr(4) + "</span> ");
                        htmlArr.push("<span class='opr' style='background:" + filters.o.obs[ob.o].color + "'>" + ob.o + "</span><br />");
                        htmlArr.push("<span class='iso'>" + ob.i + "</span><br />");
                        htmlArr.push("<span class='mt'>" + ob.m + "MT</span> ");
                        htmlCell.innerHTML = htmlArr.join("");
                    } else {
                        htmlCell.innerHTML = "&nbsp;";
                        htmlCell.className = "empty";
                    }
                    k % 2 === 0 ? htmlRow.appendChild(htmlCell) : htmlRow.insertBefore(htmlCell, htmlRow.firstChild);
                }

                htmlCell = document.createElement("td");
                htmlCell.innerHTML = tiers[j];
                htmlCell.className = "th";
                htmlRow.insertBefore(htmlCell, htmlRow.firstChild);

                htmlCell = document.createElement("td");
                htmlCell.innerHTML = tiers[j];
                htmlCell.className = "th";
                htmlRow.appendChild(htmlCell);
            }

            htmlRow = createThTable();
            htmlTable.appendChild(htmlRow);

            me.bayInfoTable.innerHTML = "";
            me.bayInfoTable.appendChild(htmlTable);
        }

        function animateBays(bayToAnimate, timing, addC, delC, bayY) {
            var key, i, bayM, bayMeven, iEvenBay, addToShipHouse, bayGroup;

            iEvenBay = bayToAnimate - 1;
            if (!g3Bays["b" + __s__.pad(iEvenBay, 3)]) {
                iEvenBay += 2;
            }

            for (key in g3Bays) {
                bayGroup = g3Bays[key];
                i = Number(bayGroup.name.replace("b", ""));
                if (i !== bayToAnimate && i !== iEvenBay) {
                    if (i < bayToAnimate) {
                        TweenLite.to(bayGroup.position, timing, { z: bayGroup.originalZ - addC, delay: delC, ease: Power2.easeInOut });
                    } else {
                        TweenLite.to(bayGroup.position, timing, { z: bayGroup.originalZ + addC, delay: delC, ease: Power2.easeInOut });
                    }
                }
            }

            if (app3d.renderer3d.shipHouse.mesh.visible) {
                addToShipHouse = bayToAnimate < shipHouse.currPosBay ? addC : -addC;
                TweenLite.to(shipHouse.mesh.position, timing, { z: shipHouse.currPosZ + addToShipHouse, delay: delC, ease: Power2.easeInOut });
            }

            bayM = g3Bays["b" + __s__.pad(bayToAnimate, 3)];
            bayMeven = g3Bays["b" + __s__.pad(iEvenBay, 3)];
            if (bayM) {
                TweenLite.to(bayM.position, timing, { y: bayY, delay: 0.5, ease: Power2.easeInOut });
                //bayM.labels.visible = !!bayY;
            }
            if (bayMeven) {
                TweenLite.to(bayMeven.position, timing, { y: bayY, delay: 0.5, ease: Power2.easeInOut });
            }

            return bayM.originalZ;
        }

        function separateBay(sBay) {
            var key,
                i,
                bayGroup,
                camZ,
                camY,
                camX,
                cY,
                topPos,
                baySelected,
                bayY,
                delayUp,
                me = controlsControl,
                openBaypanelButtonZ,
                addC,
                opened,
                options = app3d.options,
                controls = app3d.renderer3d.controls,
                camPos = app3d.renderer3d.camera.position;

            me.pauseControls(true);
            me.expandViewBtn.setAttribute("disabled", "disabled");
            opened = me.baySelected !== "";
            if (opened) {
                //cerramos
                animateBays(Number(me.baySelected), 0.35, 0, 0, 0);
                //abrimos
                if (iBay > 0) {
                    newZ = animateBays(iBay, 0.4, sepZ, .75, topY);
                }
            } else {
                //abrimos uno nuevo
                newZ = animateBays(iBay, 1, sepZ, 0, topY);
            }

            if (sBay !== "") {
                me.baySelected = sBay;
                camZ = newZ + 250;
                camY = topY;
                camX = 0;
                cY = topY - 10;
                delayUp = 0.5;
                controls.dampingFactor = options.dampingFactorIn;
                openBaypanelButtonZ = 30;
                newZ += 11;
                me.checkboxHatchCovers.setAttribute("disabled", "disabled");
                me.expandViewBtn.setAttribute("disabled", "disabled");
            } else {
                me.baySelected = "";
                camZ = me.initialCameraPosition.z;
                camY = me.initialCameraPosition.y;
                camX = me.initialCameraPosition.x;
                cY = 0;
                newZ = me.initialCameraPosition.targetZ;
                delayUp = 0;
                controls.dampingFactor = options.dampingFactorOut;
                openBaypanelButtonZ = -300;
                me.checkboxHatchCovers.removeAttribute("disabled");
            }
            TweenLite.to(camPos, 1, { x: camX, y: camY, z: camZ, delay: delayUp, ease: Power2.easeInOut });
            TweenLite.to(controls.target, 2.0, { y: cY, x: 0, z: newZ, ease: Power2.easeInOut });
            TweenLite.to(me.openBayInfo, 1.0, { left: openBaypanelButtonZ, delay: delayUp * 4, ease: Power2.easeInOut });
            setTimeout(function () {
                if (me.baySelected === "") {
                    me.expandViewBtn.removeAttribute("disabled");
                }
                me.pauseControls(false);
            }, 2500);
        }

        separateBay(!sBay ? "" : sBay);
        if (!!sBay) {
            me.dropAddHouse.setAttribute("disabled", "disabled");
            generateTable(iBay);
        } else {
            me.dropAddHouse.removeAttribute("disabled");
        }
    },

    showBayInfo: function showBayInfo(ev) {

        var show = ev.target.id === "open-panel",
            me = controlsControl;

        if (show) {
            me.bayInfo.style.display = "block";
            app3d.pauseRendering();
        } else {
            me.bayInfo.style.display = "none";
            app3d.resumeRendering();
        }
    },

    tryToLaunchBay: function tryToLaunchBay(sBay) {
        var me = controlsControl,
            dataStructured = app3d.data.dataStructured,
            iBay,
            tryBay;

        if (!sBay || sBay === "n") {
            return;
        }

        if (dataStructured[sBay]) {
            me.dropBays.value = me.dropBaysDictionary[sBay];
            me.isolateBay(sBay);
            return;
        }

        iBay = Number(sBay);
        tryBay = __s__.pad(iBay + 1, 3);

        if (dataStructured[tryBay]) {
            me.dropBays.value = tryBay;
            me.isolateBay(tryBay);
        }
    },

    moveShipHouseLnr: function moveShipHouseLnr(ev) {
        var v = ev.target.value;
        controlsControl.moveShipHouse(v);
    },

    moveShipHouse: function moveShipHouse(v) {
        var key,
            bayGroup,
            i,
            me = controlsControl,
            bays,
            j,
            lenJ,
            shipHouse = app3d.renderer3d.shipHouse,
            g3Bays = app3d.renderer3d.g3Bays,
            hatchCovers = app3d.renderer3d.hatchCovers,
            shipHouseSpace = me.shipHouseSpace;

        app3d.pauseRendering();

        if (shipHouse.currPosBay > 0) {
            for (key in g3Bays) {
                bayGroup = g3Bays[key];
                i = Number(bayGroup.name.replace("b", ""));
                if (i < shipHouse.currPosBay) {
                    bayGroup.position.z += shipHouseSpace;
                    bayGroup.originalZ += shipHouseSpace;

                    if (hatchCovers[key]) {
                        hatchCovers[key].position.z += shipHouseSpace;
                        hatchCovers[key].originalZ += shipHouseSpace;
                    }
                }
            }
        }

        if (v === "") {
            shipHouse.mesh.visible = false;
            app3d.resumeRendering();
            return;
        }

        shipHouse.currPosBay = Number(v);

        for (key in g3Bays) {
            bayGroup = g3Bays[key];
            i = Number(bayGroup.name.replace("b", ""));
            if (i < shipHouse.currPosBay) {
                bayGroup.position.z -= shipHouseSpace;
                bayGroup.originalZ -= shipHouseSpace;

                if (hatchCovers[key]) {
                    hatchCovers[key].position.z -= shipHouseSpace;
                    hatchCovers[key].originalZ -= shipHouseSpace;
                }
            }
        }

        shipHouse.mesh.visible = true;
        shipHouse.mesh.position.z = g3Bays["b" + v].position.z - shipHouseSpace - 0.5;
        shipHouse.currPosZ = Number(shipHouse.mesh.position.z);

        app3d.resumeRendering();
    },

    checkKeyPressed: function checkKeyPressed(e) {
        var me = controlsControl;

        switch (e.keyCode) {
            case 27:
                if (me.isExpanded) {
                    return;
                }

                if (me.baySelected !== "") {
                    me.dropBays.value = "";
                    me.bayInfo.style.display = "none";
                    app3d.renderer3d._isRendering = true;
                    me.isolateBay("");
                } else {
                    TweenLite.to(app3d.renderer3d.camera.position, 1.0, { y: me.initialCameraPosition.y,
                        x: me.initialCameraPosition.x,
                        z: me.initialCameraPosition.z,
                        ease: Power2.easeInOut
                    });
                }

                break;
        }
    },

    showColorsTable: function showColorsTable(attr) {
        var tableColors = document.getElementById("tableColors"),
            liColors = [],
            key,
            attr,
            isTf,
            val,
            filters = app3d.data.filters;

        isTf = filters[attr].tf;
        for (key in filters[attr].obs) {
            val = filters[attr].obs[key];
            if (isTf) {
                liColors.push("<li><span style='background:" + val.color + "'></span>" + (key === "1" ? "yes" : "no") + "</li>");
            } else {
                liColors.push("<li><span style='background:" + val.color + "'></span>" + key + "</li>");
            }
        }
        tableColors.innerHTML = liColors.join("");
    },

    expandView: function expandView(ev) {
        var me = controlsControl,
            doExpand = ev.target.checked,
            iBay = undefined,
            g3Bay = undefined,
            key = undefined,
            j = undefined,
            g3Bays = app3d.renderer3d.g3Bays,
            dataStructured = app3d.data.dataStructured,
            maxWidth = app3d.renderer3d.maxWidth,
            extraSep = app3d.options.extraSep,
            xAdd = maxWidth * (9.5 + extraSep) * 1.5,
            xAccum = xAdd,
            visib = true,
            lastBay = app3d.data.lastBay;

        //Aggregates num of containers by block
        function calculateContsByBlock() {
            if (me.numContsByBlock) {
                return;
            }

            var ncbb = {},
                j = undefined,
                key = undefined,
                numContsByBay = app3d.data.numContsByBay;

            for (j = 1; j <= lastBay + 1; j += 1) {
                key = __s__.pad(j, 3);
                g3Bay = g3Bays["b" + key];
                if (!g3Bay) {
                    continue;
                }
                if (!ncbb[g3Bay.compactBlockNum]) {
                    ncbb[g3Bay.compactBlockNum] = { n: 0 };
                }

                ncbb[g3Bay.compactBlockNum].n += numContsByBay[key] || 0;
            }

            me.numContsByBlock = ncbb;
        }

        //Expands the bays horizontally
        function expandBays() {
            var cbbj = undefined;

            me.dropBays.setAttribute("disabled", "disabled");
            me.dropAddHouse.setAttribute("disabled", "disabled");

            if (me.baySelected !== "") {
                me.openBayInfo.style.left = "-300px";
            }

            for (j = 1; j <= lastBay + 1; j += 1) {
                key = __s__.pad(j, 3);
                g3Bay = g3Bays["b" + key];

                if (!g3Bay) {
                    continue;
                }
                cbbj = me.numContsByBlock[g3Bay.compactBlockNum];

                if (g3Bay.isBlockStart && cbbj.n) {
                    xAccum -= xAdd;
                    g3Bay.labels.visible = true;
                }

                g3Bay.position.z = j & 1 && !g3Bay.isBlockStart ? 22.5 + extraSep : 0;
                g3Bay.position.x = xAccum;
                g3Bay.position.y = 0;
            }

            me.prevnextNum = 1;
            me.expandedArrowPrev.className = "prevnext bay-prev noselect ";

            app3d.renderer3d.simpleDeck.visible = false;
            app3d.renderer3d.hatchDeck.visible = false;
            app3d.renderer3d.shipHouse.prevVisible = app3d.renderer3d.shipHouse.mesh.visible;
            app3d.renderer3d.shipHouse.mesh.visible = false;
            app3d.renderer3d.camera.position.set(0, /*app3d.data.aboveTiers.n * 0*/-2, -xAdd * 0.8);
            app3d.renderer3d.controls.target.set(0, 0, 20);
            me.prevnextCont.style.display = "block";

            me._showBaysHatchCovers(me.hatchDecksVisible);
        }

        function contractBays() {
            for (key in g3Bays) {
                g3Bay = g3Bays[key];
                g3Bay.position.z = g3Bay.originalZ;
                g3Bay.position.x = 0;
                g3Bay.position.y = 0;
                if (g3Bay.labels) {
                    g3Bay.labels.visible = false;
                }
            }

            var ic = controlsControl.initialCameraPosition;
            app3d.renderer3d.setCameraPosition(ic.x, ic.y, ic.z);
            app3d.renderer3d.controls.target.x = 0;
            app3d.renderer3d.controls.target.y = 0;
            app3d.renderer3d.controls.target.z = ic.targetZ;

            app3d.renderer3d.simpleDeck.visible = true;
            app3d.renderer3d.hatchDeck.visible = me.hatchDecksVisible;
            app3d.renderer3d.shipHouse.mesh.visible = app3d.renderer3d.shipHouse.prevVisible;

            me.prevnextCont.style.display = "none";
            me.pauseControls(false);
        }

        me.expandedArrowPrev = document.getElementById("bay-prev");
        me.expandedArrowNext = document.getElementById("bay-next");

        calculateContsByBlock();
        me.isExpanded = doExpand;

        app3d.pauseRendering();
        (doExpand ? expandBays : contractBays)();
        app3d.resumeRendering();
    },

    expandViewNext: function expandViewNext() {
        controlsControl.expandViewNextPrev(true);
    },
    expandViewPrev: function expandViewPrev() {
        controlsControl.expandViewNextPrev(false);
    },

    expandViewNextPrev: function expandViewNextPrev(next) {
        var me = controlsControl,
            timing = 0.5,
            key = undefined,
            gBay = undefined,
            newBlockNum = undefined,
            g3Bays = app3d.renderer3d.g3Bays,
            lastBay = app3d.data.lastBay;

        var myXAnd = function myXAnd(a, b) {
            return a ? b : !b;
        };

        function showBays() {
            var g3Bay = undefined,
                j = undefined;

            newBlockNum = me.prevnextNum;
            do {
                newBlockNum = newBlockNum + (next ? 1 : -1);
                if (newBlockNum <= 0 || newBlockNum > app3d.renderer3d.maxCompactBlockNums) {
                    return null;
                }
            } while (me.numContsByBlock[newBlockNum].n <= 0);

            me.expandedArrowPrev.className = "prevnext bay-prev noselect " + (newBlockNum > 1 ? "active" : "");
            me.expandedArrowNext.className = "prevnext bay-next noselect " + (newBlockNum === app3d.renderer3d.maxCompactBlockNums ? "" : "active");

            for (j = 1; j <= lastBay + 1; j += 1) {
                key = __s__.pad(j, 3);
                g3Bay = g3Bays["b" + key];

                if (!g3Bay) {
                    continue;
                }
                if (g3Bay.compactBlockNum === newBlockNum) {
                    if (me.numContsByBlock[g3Bay.compactBlockNum].n) {
                        return g3Bay;
                    }
                }
            }
            return null;
        }

        gBay = showBays();
        if (!gBay) {
            return;
        }

        TweenLite.to(app3d.renderer3d.camera.position, timing, { x: gBay.position.x, ease: Power2.easeInOut });
        TweenLite.to(app3d.renderer3d.controls.target, timing, { x: gBay.position.x, ease: Power2.easeInOut });

        me.prevnextNum = newBlockNum;
    },

    toggleHatchCovers: function toggleHatchCovers(ev) {
        var me = controlsControl,
            v = ev.target.checked,
            hcs = app3d.renderer3d.hatchDeck;

        me.hatchDecksVisible = v;

        if (!me.isExpanded) {
            hcs.visible = v;
            me._showBaysHatchCovers(false);
        } else {
            hcs.visible = false;
            me._showBaysHatchCovers(v);
        }
    },

    _showBaysHatchCovers: function _showBaysHatchCovers(s) {
        var key = undefined,
            g3Bay = undefined,
            g3Bays = app3d.renderer3d.g3Bays;

        for (key in g3Bays) {
            g3Bay = g3Bays[key];
            if (!g3Bay.isBlockStart) {
                continue;
            }
            if (g3Bay.hatchC) {
                g3Bay.hatchC.visible = s;
            }
        }
    }

}; //controlsControl

/* Main program 3D ------------------------------------------------  */

//Initialize
app3d = new scene.VesselsApp3D(node, titleNode, infoNode, bayNode);
//LoadUrl
app3d.loadUrl(queryParams.json, i18labels.LOADING_DATA).then(function (loadedData) {
    var renderer3d = app3d.renderer3d,
        modelsFactory = app3d.modelsFactory,
        maxDepth = undefined,
        maxDepthHalf = undefined;

    //Title
    app3d.updateHtmlTitle(loadedData.VesselName, loadedData.PlaceOfDeparture, loadedData.VoyageNumber);

    //Process data
    app3d.data = app3d.loadData(loadedData);

    //Generate 3D objects
    //Pass 1. Map to bays & models
    for (var j = 0, lenJ = app3d.data.data.info.contsL; j < lenJ; j += 1) {
        var obj = app3d.data.data.conts[j];
        renderer3d.createBay(obj.bay);
        modelsFactory.addIsoModel(obj);
    }
    //Pass 2.
    modelsFactory.extendSpecs(app3d.data.filters);
    renderer3d.createBaseModels(modelsFactory.isoModels);
    renderer3d.create3dContainersFromData(app3d.data);
    if (app3d.data.data.conts[0]) {
        renderer3d.putInfoWindow(app3d.data.data.conts[0]);
    }

    //Init controls of this app
    controlsControl.init();
    controlsControl.showColorsTable("i");
    controlsControl.tryToLaunchBay(app3d.initialBay);

    //Reposition camera
    maxDepth = renderer3d.maxDepth;
    maxDepthHalf = Math.round(maxDepth / 2);
    controlsControl.initialCameraPosition = renderer3d.setCameraPosition(-Math.round(maxDepth * 0.75), 350, Math.round(maxDepth * 0.5));

    renderer3d.controls.maxDistance = maxDepth * 1.5;
    renderer3d.controls.target.z = maxDepthHalf;
    controlsControl.initialCameraPosition.targetZ = maxDepthHalf;
}, function (msg) {
    app3d._node.loadingDiv.setMessage(msg, true);
    app3d._node.loadingDiv.updateLoader(0.0, 1.0);
});

/*
.catch(function(msg) {
  app3d._node.loadingDiv.setMessage(msg, true);
  app3d._node.loadingDiv.updateLoader(0.0, 1.0);
})*/window.appVessels3D = app3d;

},{"../core/i18labels.js":3,"../core/vessels-3d.js":6,"../utils/dom-utilities.js":10,"../utils/js-helpers.js":11}],2:[function(require,module,exports){
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

                me.divLoading.show();

                if (!jsonUrl) {
                    reject(i18labels.INVALID_DATA_SOURCE);
                    return;
                }

                me.divLoading.show();
                me.divLoading.startAnimation();
                if (loadingText) {
                    me.divLoading.setMessage(loadingText);
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
                iTierMin = undefined,
                iTierMinAbove = undefined,
                maxWidth = 0,
                hasZeroCell = false,
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

            //Min tiers below & above
            iTierMin = Number(_.min(_.keys(belowTiers.tiers)));
            iTierMinAbove = Number(_.min(_.keys(aboveTiers.tiers)));

            return {
                data: data,
                dataStructured: dataStructured,
                belowTiers: belowTiers,
                aboveTiers: aboveTiers,
                containersIDs: containersIDs,
                numContsByBay: numContsByBay,
                allContainerMeshesObj: allContainerMeshesObj,
                filters: filters,
                iTierMin: iTierMin,
                iTierMinAbove: iTierMinAbove,
                maxWidth: maxWidth,
                firstBay: _.min(_.keys(dataStructured)),
                lastBay: _.max(_.keys(dataStructured)),
                hasZeroCell: hasZeroCell
            };
        }
    }]);

    return DataLoader;
})();

exports.DataLoader = DataLoader;

},{"../utils/dom-utilities.js":10,"../utils/js-helpers.js":11,"./i18labels.js":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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
                material,
                materialPos,
                rcolor = new RColor.RColor(),
                color,
                hexColor,
                renderer3d = this.appScene.renderer3d;

            for (key in filters) {
                attr = filters[key];
                for (val in attr.obs) {

                    spec = attr.obs[val];

                    color = rcolor.get(true);
                    hexColor = parseInt(color.replace(/^#/, ''), 16);
                    materialPos = renderer3d.addContainerMaterial(hexColor);

                    spec.color = color;
                    spec.hexColor = hexColor;
                    spec.materialPos = materialPos;
                }
            }
        }
    }]);

    return ModelsFactory;
})();

exports.ModelsFactory = ModelsFactory;

},{"../utils/random-color.js":13}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var __s__ = require('../utils/js-helpers.js'),
    __d__ = require('../utils/dom-utilities.js'),
    SpriteText2D = require('../text2D/SpriteText2D.js'),
    textAlign = require('../text2D/textAlign.js');

//Class Renderer3D

var Renderer3D = (function () {
    function Renderer3D(parent, w, h) {
        _classCallCheck(this, Renderer3D);

        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        this.controls = null;

        this.appScene = parent;
        this.container = parent._node;
        this.width = w;
        this.height = h;
        this.frames = 0;

        this._INTERSECTED = null;
        this.followMouseEvents = false;

        this.mouseStart = new THREE.Vector2();
        this.mouseLastClick = new Date();

        this._isRendering = true;
        this._floatingCamera = true;
        this._modelsLoaded = {};

        this.g3Bays = {};
        this.models = {};
        this.maxDepth = 0;
        this.maxWidth = 0;

        this.shipHouse = null;
        this.simpleDeck = null;
        this.hatchCover = null;

        this.hatchCovers = {};

        this.allMaterials = [];
        this.basicMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, wireframe: true });
        this.selectionMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide, opacity: 1, transparent: false });

        this.containersGroup = null;
    }

    _createClass(Renderer3D, [{
        key: 'init',
        value: function init() {
            var me = this,
                material = undefined,
                light = undefined,
                lightsGroup = undefined,
                mesh = undefined,
                lightPosAn = 800,
                options = this.appScene.options;

            function prepareDirectionalLight(x, y, z) {
                var ll = new THREE.DirectionalLight(0xffffff, 0.30);
                ll.position.set(x, y, z);
                ll.castShadow = true;
                ll.shadow.camera.left = -lightPosAn;
                ll.shadow.camera.right = lightPosAn;
                ll.shadow.camera.top = lightPosAn;
                ll.shadow.camera.bottom = -lightPosAn;
                ll.shadow.camera.far = 1600;
                ll.shadow.camera.near = 1;

                return ll;
            }

            if (this.container === null || this.container === undefined) {
                console.error("Container is null. Halting.");return;
            }
            if (!this.width) {
                console.error("Width is null or zero. Halting.");return;
            }
            if (!this.height) {
                console.error("Height is null or zero. Halting.");return;
            }

            this.scene = new THREE.Scene();
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });
            this.renderer.setClearColor(options.colors.background, 1);

            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(this.width, this.height);

            this.container.divRenderC.appendChild(this.renderer.domElement);

            this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 30000);
            this.camera.position.z = options.initialCameraPosition.z;
            this.camera.position.x = options.initialCameraPosition.x;
            this.camera.position.y = options.initialCameraPosition.y;

            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = options.dampingFactorOut || 0.2;
            this.controls.minPolarAngle = Math.PI / 5;
            this.controls.maxPolarAngle = Math.PI / 5 * 4;
            this.controls.maxDistance = options.initialCameraPosition.z * 2;
            this.controls.minDistance = options.initialCameraPosition.z / 2;
            this.controls.enableKeys = false;
            this.controls.enablePan = false;

            this.raycaster = new THREE.Raycaster();
            this.mouseVector = new THREE.Vector2();

            lightsGroup = new THREE.Group();

            light = prepareDirectionalLight(-lightPosAn, lightPosAn, -lightPosAn);
            lightsGroup.add(light);

            light = prepareDirectionalLight(lightPosAn, lightPosAn, -lightPosAn);
            lightsGroup.add(light);

            light = prepareDirectionalLight(lightPosAn, lightPosAn, lightPosAn);
            lightsGroup.add(light);

            light = prepareDirectionalLight(-lightPosAn, lightPosAn, lightPosAn);
            lightsGroup.add(light);

            light = new THREE.DirectionalLight(0xf8f7ee, 0.15);
            light.position.set(0, -300, -50);
            lightsGroup.add(light);

            this.lightsGroup = lightsGroup;

            light = new THREE.AmbientLight(options.colors.sunlight, 0.7);
            //light.castShadow = true;
            this.scene.add(light);
            this.scene.add(lightsGroup);

            var containersGroup = new THREE.Object3D();
            this.scene.add(containersGroup);
            this.containersGroup = containersGroup;

            __d__.addEventLnr(window, "mousemove", function (e) {
                me.mouseVector.x = e.clientX / me.width * 2 - 1;
                me.mouseVector.y = -(e.clientY / me.height) * 2 + 1;
            });
        }
    }, {
        key: 'createBay',
        value: function createBay(k) {
            var me = this,
                holder = undefined,
                bbox = undefined,
                hatchC = undefined;

            if (me.g3Bays["b" + k]) {
                return me.g3Bays["b" + k];
            }

            //Create holder
            holder = new THREE.Group();
            holder.name = "b" + k;
            holder.iBay = Number(k);
            holder.isBlockStart = false;

            //Add to bays-array & scene
            me.g3Bays["b" + k] = holder;
            me.containersGroup.add(holder);

            return holder;
        }
    }, {
        key: '_addLabelsToBay',
        value: function _addLabelsToBay(bay, posY, posZ) {
            var fwdStr = arguments.length <= 3 || arguments[3] === undefined ? "FWD" : arguments[3];
            var aftStr = arguments.length <= 4 || arguments[4] === undefined ? "AFT" : arguments[4];

            var holderLabels = undefined,
                aboveTiersN = this.appScene.data.aboveTiers.n,
                extraSep = this.appScene.options.extraSep,
                labelScale = this.appScene.options.labelScale || 2;

            holderLabels = new THREE.Group();
            holderLabels.name = "labels";
            holderLabels.visible = false;
            bay.labelsCanBeVisible = true;

            //Create FWD/AFT Labels
            var textMesh = new SpriteText2D(fwdStr, {
                align: textAlign.center,
                font: '32px Arial',
                fillStyle: '#888888' });

            textMesh.position.z = -15;
            textMesh.scale.set(labelScale, labelScale, 1);
            holderLabels.add(textMesh);

            textMesh = new SpriteText2D(aftStr, {
                align: textAlign.center,
                font: '32px Arial',
                fillStyle: '#888888' });

            textMesh.position.z = 60;
            textMesh.scale.set(labelScale, labelScale, 1);
            holderLabels.add(textMesh);

            //Add to Bay       
            bay.add(holderLabels);
            bay.labels = holderLabels;
            holderLabels.position.y = posY;
            holderLabels.position.z = posZ;
            //holderLabels.position.x = 3; 
        }
    }, {
        key: 'addContainerMaterial',
        value: function addContainerMaterial(hexColor) {
            var material = new THREE.MeshStandardMaterial({
                color: hexColor,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1
            });

            this.allMaterials.push(material);
            return this.allMaterials.length - 1;
        }
    }, {
        key: 'createBaseModels',
        value: function createBaseModels(isoModels) {
            var me = this,
                key,
                isoModel,
                h,
                obj,
                spec,
                cldr,
                filters = this.appScene.data.filters,
                geom,
                mesh;

            for (key in isoModels) {

                isoModel = isoModels[key];
                h = isoModel.h;
                spec = filters.i.obs[key];

                if (!isoModel.t) {
                    //Not a TANK
                    obj = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, h), new THREE.Vector2(8, h), new THREE.Vector2(8, 0)]);

                    geom = new THREE.ExtrudeGeometry(obj, {
                        bevelEnabled: false,
                        steps: 1,
                        amount: isoModel.d
                    });

                    mesh = new THREE.Mesh(geom, me.allMaterials[spec.materialPos]);
                } else {
                    //A tank               
                    geom = new THREE.CylinderGeometry(4, 4, isoModel.d, 16);
                    mesh = new THREE.Mesh(geom, me.allMaterials[spec.materialPos]);
                    geom.translate(-4, isoModel.d / 2, -4);
                    mesh.rotation.z = -Math.PI / 2; //Cilinder is upSided
                    mesh.rotation.y = -Math.PI / 2;
                }

                mesh.materialPos = spec.materialPos;
                mesh.dynamic = true;
                this.models[key] = mesh;
            }
        }
    }, {
        key: 'create3dContainersFromData',
        value: function create3dContainersFromData(d) {
            var me = this,
                data = d.data,
                belowTiers = d.belowTiers,
                aboveTiers = d.aboveTiers,
                iTierMin = d.iTierMin,
                iTierMinAbove = d.iTierMinAbove,
                dataStructured = d.dataStructured,
                allContainerMeshesObj = d.allContainerMeshesObj,
                numContsByBay = d.numContsByBay,
                g3Bays = this.g3Bays,
                loadingDiv = this.appScene._node.loadingDiv,
                extraSep = this.appScene.options.extraSep,
                j = undefined,
                lenJ = data.info.contsL,
                len = undefined,
                key = undefined,
                key2 = undefined,
                key3 = undefined,
                aCell = undefined,
                arrCellTiers = undefined,
                tierHeightAcc = undefined,
                point = undefined,
                model = undefined,
                mesh = undefined,
                spec = undefined,
                h = undefined,
                bT = undefined,
                zAccum = 0,
                x = undefined,
                y = undefined,
                z = undefined,
                prevBay = undefined,
                extraAdd = undefined,
                hasZeroRow = undefined,
                isOdd = undefined,
                floorAbove = 4,
                floorBelow = 4 - extraSep,
                lastBay = undefined,
                iBay = undefined,
                iCell = undefined,
                iTier = undefined,
                lastBayDepth = undefined,
                g3Bay = undefined,
                maxDepth = undefined,
                tmpArr = [],
                compactBlockNum = undefined,
                keyEven = undefined,
                keyEvenPrev = undefined,
                bayEven = undefined,
                numContsByBlock = {},
                materialHatch = new THREE.MeshStandardMaterial({ color: 0x666666 }),
                compareLocations = function compareLocations(a, b) {
                a.p === b.p ? 0 : a.p < b.p ? -1 : 1;
            };

            lastBay = _.max(_.keys(dataStructured));
            lastBayDepth = dataStructured[lastBay].maxD;
            floorBelow = _.reduce(belowTiers.tiers, function (memo, ob) {
                return memo + ob.h + extraSep;
            }, 0) + floorBelow;

            compactBlockNum = 0;
            //Position of Bays
            for (j = 1; j <= lastBay; j += 2) {
                key = __s__.pad(j, 3);
                keyEven = __s__.pad(j + 1, 3);
                keyEvenPrev = __s__.pad(j - 1, 3);
                bayEven = g3Bays["b" + keyEven];

                if (!dataStructured[key]) {
                    dataStructured[key] = { cells: {}, n: 0, z: 0 };
                }

                if (j % 2 === 1) {
                    zAccum += 22.5 + extraSep;
                }

                //Odd
                dataStructured[key].z = zAccum;
                g3Bay = me.createBay(key);
                g3Bay.position.z = zAccum;
                g3Bay.originalZ = zAccum;
                g3Bay.isBlockStart = true;

                //Even
                if (bayEven) {
                    bayEven.position.z = zAccum;
                    bayEven.originalZ = zAccum;
                }

                //Even Previous (to check if it starts a new block)
                if (numContsByBay[keyEvenPrev]) {
                    g3Bay.isBlockStart = false;
                }

                if (g3Bay.isBlockStart) {
                    compactBlockNum += 1;
                    this._addLabelsToBay(g3Bay, aboveTiers.n * (9.5 + extraSep), //y
                    0 //z
                    );
                }

                //Blocks for side-by-side
                g3Bay.compactBlockNum = compactBlockNum;
                if (bayEven) {
                    bayEven.compactBlockNum = compactBlockNum;
                }
            }

            maxDepth = zAccum + lastBayDepth;
            this.maxDepth = maxDepth;
            this.maxWidth = d.maxWidth;
            this.maxCompactBlockNums = compactBlockNum;

            //Iterate to create 3d containers & position
            for (j = 0, lenJ = data.info.contsL; j < lenJ; j += 1) {
                point = data.conts[j];
                model = me.models[String(point.i)];
                iBay = point.iBay;

                iCell = Number(point.cell);
                x = (iCell % 2 === 0 ? iCell / 2 : -(iCell + 1) / 2) * (8 + extraSep); // x coordinate

                iTier = Number(point.tier); // y coordinate               
                if (iTier >= 78) {
                    y = (iTier - iTierMinAbove) / 2 * (9.5 + extraSep) + floorAbove;
                } else {
                    y = (iTier - iTierMin) / 2 * (9.5 + extraSep) - floorBelow;
                }

                mesh = model.clone();
                mesh.materialPos = model.materialPos;
                mesh.name = "cont_" + point.cDash;
                mesh.objRef = point;
                mesh.position.x = x;
                mesh.position.y = y;
                mesh.position.z = 0; // positioned object within bay
                mesh.updateMatrix();
                mesh.matrixAutoUpdate = false;
                mesh.isBasic = false; //Basic material adhoc

                g3Bays["b" + point.bay].add(mesh);
                allContainerMeshesObj[point.cDash] = mesh;
            }

            me._createShipDeck();
            me._createHouse(aboveTiers.n);
            me._createHatchCovers();

            loadingDiv.stopAnimation();
            setTimeout(function () {
                loadingDiv.hide();
            }, 500);
        }
    }, {
        key: '_createHatchCovers',
        value: function _createHatchCovers() {
            var extraSep = this.appScene.options.extraSep,
                maxWidth = this.maxWidth,
                maxDepth = this.maxDepth,
                maxWidthFeet = maxWidth * (8 + extraSep),
                dataStructured = this.appScene.data.dataStructured,
                g3Bays = this.g3Bays,
                lastBay = this.appScene.data.lastBay,
                addZeroCell = this.appScene.data.hasZeroCell ? 1 : 0,
                hatchesArr = [],
                j = undefined,
                lenJ = undefined,
                key = undefined,
                g3Bay = undefined,
                icb = [],
                icbn = undefined,
                maxBlock = 0,
                symmetricMax = undefined,
                hatchGroup3D = new THREE.Group(),
                msh = undefined,
                block = undefined,
                hatch = undefined,
                posL = undefined,
                x = undefined,
                z = undefined,
                dd = undefined,
                hatchLine = undefined,
                materialHatch = new THREE.MeshStandardMaterial({ color: 0x666666 });

            var maxContsDepth = 60;

            var xCoordinate = function xCoordinate(pos) {
                return (pos % 2 === 0 ? pos / 2 : -(pos + 1) / 2) * (8 + extraSep);
            };

            function generateHatchArray(w) {
                var hatchNum = undefined,
                    hatchNumInt = undefined,
                    hatchWidth = undefined,
                    hatchDiff = undefined,
                    arrHatchesWidth = undefined;

                hatchWidth = w === 5 || w === 6 || w === 9 ? 3 : w <= 4 ? w : 4;
                hatchNum = w / hatchWidth;
                hatchNumInt = Math.ceil(hatchNum);
                arrHatchesWidth = new Array(hatchNumInt);

                //Fill array
                for (var _j = 0; _j < hatchNumInt; _j += 1) {
                    arrHatchesWidth[_j] = hatchWidth;
                }
                hatchDiff = Math.ceil((hatchNum - Math.floor(hatchNum)) * hatchWidth);
                if (hatchDiff > 0) {
                    arrHatchesWidth[Math.floor(hatchNumInt / 2)] = hatchDiff;
                }

                return arrHatchesWidth;
            }

            function createHatch3D(w, d) {
                var obj = undefined,
                    geom = undefined,
                    mesh = undefined,
                    wFeet = w * (8 + extraSep) - extraSep;

                obj = new THREE.Shape([new THREE.Vector2(-wFeet, 0), new THREE.Vector2(-wFeet, d), new THREE.Vector2(0, d), new THREE.Vector2(0, 0)]);

                geom = new THREE.ExtrudeGeometry(obj, {
                    bevelEnabled: false,
                    steps: 1,
                    amount: 3
                });

                mesh = new THREE.Mesh(geom, materialHatch);
                mesh.rotation.x = Math.PI / 2;
                geom.translate(8.5 + extraSep, 0, 0);
                return mesh;
            }

            //Generate info of widths per Block (width, depth)
            for (j = 1; j <= lastBay + 1; j += 2) {
                key = __s__.pad(j, 3);
                g3Bay = g3Bays["b" + key];
                if (!g3Bay) {
                    continue;
                }

                if (!icb[g3Bay.compactBlockNum] || icb[g3Bay.compactBlockNum].cells < dataStructured[key].n) {
                    icb[g3Bay.compactBlockNum] = {
                        baseBay: g3Bay.iBay,
                        cbn: g3Bay.compactBlockNum,
                        cells: dataStructured[key].n,
                        maxD: dataStructured[key].maxD,
                        posLeft: Number(_.max(_.filter(_(dataStructured[key].cells).keys(), function (k) {
                            return Number(k) % 2 === 0;
                        }), function (kk) {
                            return Number(kk);
                        })),
                        posRight: Number(_.max(_.filter(_(dataStructured[key].cells).keys(), function (k) {
                            return Number(k) % 2 === 1;
                        }), function (kk) {
                            return Number(kk);
                        }))
                    };
                } else {
                    icb[g3Bay.compactBlockNum].posLeft = Math.max(icb[g3Bay.compactBlockNum].posLeft, Number(_.max(_.filter(_(dataStructured[key].cells).keys(), function (k) {
                        return Number(k) % 2 === 0;
                    }), function (kk) {
                        return Number(kk);
                    })));
                    icb[g3Bay.compactBlockNum].posRight = Math.max(icb[g3Bay.compactBlockNum].posRight, Number(_.max(_.filter(_(dataStructured[key].cells).keys(), function (k) {
                        return Number(k) % 2 === 1;
                    }), function (kk) {
                        return Number(kk);
                    })));
                }
                maxBlock = g3Bay.compactBlockNum;
            }

            //Get accum up & down the vessel
            icb[1].maxLeftUp = icb[1].posLeft;
            icb[1].maxRightUp = icb[1].posRight;
            icb[maxBlock].maxLeftDown = icb[maxBlock].posLeft;
            icb[maxBlock].maxRightDown = icb[maxBlock].posRight;

            for (j = 2, lenJ = maxBlock + 1; j < lenJ; j += 1) {

                icb[j].maxLeftUp = Math.max(icb[j - 1].maxLeftUp, icb[j].posLeft);
                icb[j].maxRightUp = Math.max(icb[j - 1].maxRightUp, icb[j].posRight);

                icb[lenJ - j].maxLeftDown = Math.max(icb[lenJ - j + 1].maxLeftDown, icb[lenJ - j].posLeft);
                icb[lenJ - j].maxRightDown = Math.max(icb[lenJ - j + 1].maxRightDown, icb[lenJ - j].posRight);
            }

            //Create vessel shape (oval type: few-more-few). Define "borders"
            for (j = 1, lenJ = maxBlock + 1; j < lenJ; j += 1) {
                icb[j].maxLeft = Number(Math.min(icb[j].maxLeftUp, icb[j].maxLeftDown));
                icb[j].maxRight = Number(Math.min(icb[j].maxRightUp, icb[j].maxRightDown));

                //Even the load is not symmetric, this will make it symmetric
                symmetricMax = Math.max(icb[j].maxLeft, icb[j].maxRight);

                dd = !icb[j].maxD ? 22.5 : icb[j].maxD <= 20 ? 22.5 : icb[j].maxD <= 45 ? 45 : 60;
                if (dd === 0) {
                    continue;
                }

                //Calculate hatches width and depth
                if (j === 1) {
                    hatchesArr.push({
                        d: dd,
                        l: icb[j].maxLeft,
                        b: icb[j].baseBay,
                        hts: generateHatchArray(symmetricMax + addZeroCell)
                    });
                } else {
                    if (icb[j].maxLeft === icb[j - 1].maxLeft && icb[j].maxRight === icb[j - 1].maxRight && hatchesArr[hatchesArr.length - 1].d + (icb[j].maxD || 45) <= maxContsDepth) {
                        hatchesArr[hatchesArr.length - 1].d += icb[j].maxD || 45;
                    } else {
                        hatchesArr.push({
                            d: dd,
                            l: icb[j].maxLeft,
                            b: icb[j].baseBay,
                            hts: generateHatchArray(symmetricMax + addZeroCell)
                        });
                    }
                }
            }

            //Create 3D Hatches (Vessel)
            z = 22.5;
            for (j = 0, lenJ = hatchesArr.length; j < lenJ; j += 1) {
                block = hatchesArr[j];

                hatchLine = new THREE.Group();
                hatchLine.name = "baseBay-" + block.b;
                hatchLine.baseBay = block.b;
                this.hatchCovers["b" + __s__.pad(block.b, 3)] = hatchLine;

                posL = block.l;
                x = xCoordinate(posL); // x coordinate

                for (var k = 0, lenK = block.hts.length; k < lenK; k += 1) {
                    hatch = block.hts[k];
                    msh = createHatch3D(hatch, block.d);

                    msh.position.x = x - 2 * extraSep;

                    hatchLine.add(msh);
                    x -= hatch * (8 + extraSep);
                }

                hatchLine.position.z = z;
                hatchLine.originalZ = z;
                hatchGroup3D.add(hatchLine);
                z += block.d + 2 * extraSep;
            }

            //Create 3D Hatches (by Bay)
            for (key in g3Bays) {
                g3Bay = g3Bays[key];

                if (g3Bay.isBlockStart) {
                    icbn = icb[g3Bay.compactBlockNum];
                    if (!icbn.maxD) {
                        continue;
                    }

                    var xL = xCoordinate(icbn.maxLeft),
                        xR = xCoordinate(icbn.maxRight);

                    //Add hatchC
                    var obj = new THREE.Shape([new THREE.Vector2(xL + addZeroCell * (8 + extraSep), 0), new THREE.Vector2(xR, 0), new THREE.Vector2(xR, icbn.maxD), new THREE.Vector2(xL + addZeroCell * (8 + extraSep), icbn.maxD)]);

                    var geom = new THREE.ExtrudeGeometry(obj, {
                        bevelEnabled: false,
                        steps: 1,
                        amount: 2
                    });
                    var mesh = new THREE.Mesh(geom, materialHatch);
                    mesh.rotation.x = Math.PI / 2;
                    mesh.position.y = 1;
                    mesh.visible = false;
                    g3Bay.add(mesh);
                    g3Bay.hatchC = mesh;
                }
            }

            this.scene.add(hatchGroup3D);
            hatchGroup3D.position.y = 1.5;

            this.hatchDeck = hatchGroup3D;
        }
    }, {
        key: '_createShipDeck',
        value: function _createShipDeck() {
            var material = new THREE.LineBasicMaterial({ color: 0x3d8ca8, opacity: 1, linewidth: 2 }),
                extraSep = this.appScene.options.extraSep,
                maxWidth = this.maxWidth,
                maxDepth = this.maxDepth,
                ellipse = undefined,
                ellipsePath = new THREE.CurvePath(),
                ellipseGeometry = undefined,
                line = undefined,
                maxWidthFeet = maxWidth * (8 + extraSep) / 4;

            ellipsePath.add(new THREE.EllipseCurve(4, 20, maxWidthFeet, maxWidthFeet * 3, Math.PI, 0, false));
            ellipsePath.add(new THREE.EllipseCurve(4, maxDepth, maxWidthFeet, maxWidthFeet * 0.75, 0, Math.PI, false));
            ellipsePath.closePath();
            ellipseGeometry = ellipsePath.createPointsGeometry(150);
            line = new THREE.Line(ellipseGeometry, material);
            line.rotation.x = Math.PI / 2;
            this.scene.add(line);

            this.simpleDeck = line;
        }
    }, {
        key: '_createHouse',
        value: function _createHouse(hAbv) {
            var extraSep = this.appScene.options.extraSep,
                maxWidth = this.maxWidth,
                belowTiers = this.appScene.data.belowTiers,
                maxWidthFeet = maxWidth * (8 + extraSep) / 2 * 0.9,
                maxHeightFeet = Math.max(1, hAbv) * (9.5 + extraSep) + 6,
                geom,
                obj,
                mesh,
                rectGeom,
                hBel = Math.max(1, belowTiers.n * 0.7),
                yBelow = hBel * (9.5 + extraSep),
                xBelow = hBel * (8 + extraSep) / 2,
                obj3d,
                materialWindows = new THREE.MeshPhongMaterial({ color: 0x5cb2da, side: THREE.DoubleSide }),
                materialHouse = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });

            obj = new THREE.Shape([new THREE.Vector2(0, -yBelow), new THREE.Vector2(-xBelow, -yBelow), new THREE.Vector2(-maxWidthFeet, 0), new THREE.Vector2(-maxWidthFeet, maxHeightFeet), new THREE.Vector2(-maxWidthFeet - 0.25 * maxWidthFeet, maxHeightFeet + 10), new THREE.Vector2(-maxWidthFeet - 0.25 * maxWidthFeet, maxHeightFeet + 20), new THREE.Vector2(-maxWidthFeet, maxHeightFeet + 20), new THREE.Vector2(-maxWidthFeet + 0.125 * maxWidth, maxHeightFeet + 24), new THREE.Vector2(maxWidthFeet - 0.125 * maxWidth, maxHeightFeet + 24), new THREE.Vector2(maxWidthFeet, maxHeightFeet + 20), new THREE.Vector2(maxWidthFeet + 0.25 * maxWidthFeet, maxHeightFeet + 20), new THREE.Vector2(maxWidthFeet + 0.25 * maxWidthFeet, maxHeightFeet + 10), new THREE.Vector2(maxWidthFeet, maxHeightFeet), new THREE.Vector2(maxWidthFeet, 0), new THREE.Vector2(xBelow, -yBelow), new THREE.Vector2(0, -yBelow)]);

            geom = new THREE.ExtrudeGeometry(obj, {
                bevelEnabled: false,
                steps: 1,
                amount: 20
            });

            mesh = new THREE.Mesh(geom, materialHouse);
            mesh.matrixAutoUpdate = false;

            obj3d = new THREE.Object3D();
            obj3d.name = "house";
            obj3d.add(mesh);

            obj = new THREE.Shape([new THREE.Vector2(-1.125 * maxWidthFeet, 0), new THREE.Vector2(-1.125 * maxWidthFeet, 7), new THREE.Vector2(1.125 * maxWidthFeet, 7), new THREE.Vector2(1.125 * maxWidthFeet, 0)]);

            rectGeom = new THREE.ShapeGeometry(obj);
            mesh = new THREE.Mesh(rectGeom, materialWindows);
            mesh.position.y = maxHeightFeet + 10;
            mesh.position.z = -0.25;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            obj3d.add(mesh);

            mesh = new THREE.Mesh(rectGeom, materialWindows);
            mesh.position.y = maxHeightFeet + 10;
            mesh.position.z = 20.25;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            obj3d.add(mesh);

            rectGeom = new THREE.SphereGeometry(5, 32, 32);
            mesh = new THREE.Mesh(rectGeom, materialHouse);
            mesh.position.y = maxHeightFeet + 24;
            mesh.position.z = 10;
            mesh.position.x = maxWidthFeet - 10;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            obj3d.add(mesh);

            rectGeom = new THREE.SphereGeometry(5, 32, 32);
            mesh = new THREE.Mesh(rectGeom, materialHouse);
            mesh.position.y = maxHeightFeet + 24;
            mesh.position.z = 10;
            mesh.position.x = -maxWidthFeet + 10;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            obj3d.add(mesh);

            obj3d.position.x = 4;
            obj3d.position.z = -20;
            obj3d.visible = false;
            this.scene.add(obj3d);

            this.shipHouse = { mesh: obj3d, dropdown: null, currPosBay: 0, currPosZ: 0 };
        }
    }, {
        key: 'setCameraPosition',
        value: function setCameraPosition(x, y, z) {
            this.camera.position.z = z;
            this.camera.position.x = x;
            this.camera.position.y = y;
            this.controls.maxDistance = z * 2;
            this.controls.minDistance = z / 2;
            return { x: x, y: y, z: z };
        }
    }, {
        key: 'resize3DViewer',
        value: function resize3DViewer(w, h) {
            if (!this.camera) {
                return;
            }
            this.width = w;
            this.height = h;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        }
    }, {
        key: 'loadModel',
        value: function loadModel(mainScene, modelFilesDir, modelFilesMtl, modelFilesObj) {

            var that = this,
                node = this.container,
                loadDiv = node.loadingDiv,
                options = this.appScene.options,
                mats = undefined,
                mesh = undefined,
                rt = undefined,
                cm = undefined,
                loader = undefined,
                mtlLoader = undefined,
                objLoader = undefined,
                onProgress = function onProgress(xhr) {
                var percentComplete = xhr.loaded / (xhr.total || 3000000);
                loadDiv.updateLoader(percentComplete, 0.3);
            },
                onLoaded = function onLoaded(fileObj) {
                var ev = __d__.addEventDsptchr("modelLoaded");

                //Dispatch event
                ev.data = { model: fileObj };
                node.dispatchEvent(ev);

                //Finish the loading div
                loadDiv.updateLoader(1, 0.5);

                //Hide the loading div
                setTimeout(function () {
                    loadDiv.hide();
                }, 500);
            };

            return new Promise(function (resolve, reject) {
                var modelName = modelFilesObj.replace(".", "_");

                if (that._modelsLoaded[modelName]) {
                    resolve(modelName);return;
                }

                loadDiv = that.container.loadingDiv;
                loadDiv.setPercentage(0);
                loadDiv.setMessage("Loading model...");
                loadDiv.show();

                mtlLoader = new THREE.MTLLoader();
                mtlLoader.setBaseUrl(modelFilesDir + "textures/");
                mtlLoader.setPath(modelFilesDir);
                mtlLoader.load(modelFilesMtl, function (materials) {
                    var cm = undefined,
                        loader = undefined;

                    materials.preload();

                    objLoader = new THREE.OBJLoader();
                    objLoader.setPath(modelFilesDir);
                    objLoader.setMaterials(materials);
                    objLoader.load(modelFilesObj, function (object) {
                        var m = undefined,
                            mesh = new THREE.Object3D();
                        //Iterate the 3D Model
                        object.traverse(function (child) {
                            m = new THREE.Mesh(child.geometry, child.material);
                            m.name = child.name;
                            m.receiveShadow = true;
                            m.castShadow = true;
                            mesh.add(m);
                        });

                        //Add it to a Map of models
                        that._modelsLoaded[modelName] = mesh;
                        onLoaded();
                        resolve(modelName);
                        return;
                    }, onProgress, function (xhr) {
                        window.alert('An error happened loading assets');
                        console.error(xhr);
                        reject();
                    });
                });
            });
        }
    }, {
        key: 'animate',
        value: function animate() {
            var me = this;

            function anim() {
                requestAnimationFrame(anim);
                me.controls.update();
                me.render();
            }
            anim();
        }
    }, {
        key: 'render',
        value: function render() {
            var intersects = undefined,
                lenI = undefined,
                nameSel = undefined,
                selObj = undefined,
                mesh = undefined;

            if (!this._isRendering) {
                return;
            }

            this.frames += 1;

            if (this.frames & 1) {

                this.raycaster.setFromCamera(this.mouseVector.clone(), this.camera);
                intersects = this.raycaster.intersectObjects(this.containersGroup.children, true);
                lenI = intersects.length;

                if (lenI > 1) {
                    var containersIDs = this.appScene.data.containersIDs;
                    nameSel = intersects[1].object.name;
                    if (nameSel !== null && nameSel !== undefined) {

                        selObj = containersIDs[nameSel];
                        if (selObj) {
                            if (intersects[1].object !== this._INTERSECTED) {
                                //Any highlighted? return to normal texture
                                if (this._INTERSECTED) {
                                    this._INTERSECTED.material = this._INTERSECTED.isBasic ? this.basicMaterial : this.allMaterials[this._INTERSECTED.materialPos];
                                }
                                //Highlight it
                                this._INTERSECTED = intersects[1].object;
                                if (!this._INTERSECTED.isBasic) {
                                    this._INTERSECTED.material = this.selectionMaterial;
                                }

                                this.putInfoWindow(selObj);
                            }
                        }
                    }
                } else {
                    if (this._INTERSECTED) {
                        this._INTERSECTED.material = this._INTERSECTED.isBasic ? this.basicMaterial : this.allMaterials[this._INTERSECTED.materialPos];
                        this._INTERSECTED = null;
                    }
                }
            }

            //this.lightsGroup.rotation.x = this.camera.rotation.x;
            //this.lightsGroup.rotation.y = this.camera.rotation.y;
            //this.lightsGroup.rotation.z = this.camera.rotation.z;

            this.renderer.render(this.scene, this.camera);
        }
    }, {
        key: 'putInfoWindow',
        value: function putInfoWindow(selObj) {
            this.appScene._infoNode.innerHTML = "<small>Position:</small> " + selObj.p + "<br />" + "<small>ID:</small> " + selObj.c + "<br />" + "<small>ISO:</small> " + selObj.i + (selObj.r ? " / Reefer" : "") + " <small>Status:</small> " + (selObj.s ? "full" : "empty") + "<br />" + "<small>Carrier:</small> " + selObj.o + "<br />" +
            //"<small>hazardous:</small> " + (selObj.w ? "yes" : "no") + "<br />" +
            //"<small>tank:</small> " + (selObj.t ? "yes" : "no") + "<br />" +
            //"<small>OOG:</small> " + (selObj.x ? "yes" : "no") + "<br />" +
            "<small>POD:</small> " + selObj.d + "<br />" + "<small>POL:</small> " + (selObj.f || "") + " <small>Weight:</small> " + selObj.m + "MT";

            this.appScene._bayNode.innerHTML = "<small>bay</small> " + selObj.iBay;
        }
    }]);

    return Renderer3D;
})();

exports.Renderer3D = Renderer3D;

},{"../text2D/SpriteText2D.js":8,"../text2D/textAlign.js":9,"../utils/dom-utilities.js":10,"../utils/js-helpers.js":11}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');
var Preloader = require('../utils/preloader.js');
var Renderer = require('./renderer.js');
var DataLoader = require('./data-loader.js');
var ModelsFactory = require('./models-factory.js');
var i18labels = require('./i18labels.js');

//Class VesselsApp3D

var VesselsApp3D = (function () {
    function VesselsApp3D(node, titleNode, infoNode, bayNode, opts) {
        _classCallCheck(this, VesselsApp3D);

        var me = this,
            queryParams = __s__.getQueryParams();

        var version = 1.1;

        this.options = __s__.extend({
            extraSep: 0.5,
            loaderColor: "#f2f2f2",
            loaderColorSucess: "#79e3da",
            colors: { background: 0xd2eef8, sunlight: 0xe2e2ee },
            dampingFactorOut: 0.2, dampingFactorIn: 0.75,
            initialCameraPosition: { x: 0, y: 0, z: 100 },
            labelScale: 8,
            screenshots: { width: 600, height: 600, format: "png", transparent: true }
        }, opts);

        this.width = 0;
        this.height = 0;

        this._titleNode = titleNode;
        this._bayNode = bayNode;
        this._infoNode = infoNode;
        this._node = (function createDomElements() {
            var divMainC = undefined,
                divRenderC = undefined,
                divLloadingC = undefined,
                divLoadingText = undefined;

            //Main DOM element
            divMainC = document.createElement("div");
            divMainC.className = "app3d-container";
            divMainC.id = "app3d-container-" + Math.round(Math.random() * 100000);

            //Renderer container
            divRenderC = document.createElement("div");
            divRenderC.className = "app3d-render-container";
            divRenderC.id = divMainC.id + "-render";
            divMainC.appendChild(divRenderC);
            divMainC.divRenderC = divRenderC;

            //Loading div
            divLloadingC = document.createElement("div");
            divLloadingC.className = "app3d-loading-div";
            divLloadingC.id = divMainC.id + "-loading-div";
            divMainC.appendChild(divLloadingC);

            //Loading text inside loading div
            divLoadingText = document.createElement("div");
            divLoadingText.className = "app3d-loading-div-text";
            divLoadingText.id = divMainC.id + "-loading-text";
            divLloadingC.appendChild(divLoadingText);

            //initialize loader functions
            divMainC.loadingDiv = new Preloader(divLloadingC, divLoadingText, 100, me.options, "img-loader-logo");

            //Append to DOM element
            node.appendChild(divMainC);

            return divMainC;
        })();

        this.initialBay = queryParams.bay;

        this.data = null;
        this.dataLoader = new DataLoader.DataLoader(this._node.loadingDiv);

        this.renderer3d = null;
        this.modelsFactory = null;
        this._init();
    }

    //constructor

    _createClass(VesselsApp3D, [{
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
                mod = undefined,
                node = this._node,
                hasWebGL = Detector.canvas && Detector.webgl;

            //Check WebGL
            if (!hasWebGL) {
                node.loadingDiv.show();
                node.loadingDiv.setMessage(node.parentNode.getAttribute(!window.WebGLRenderingContext ? "data-gpu" : "data-webgl"));
                return;
            }

            //Initialize renderer
            this.updateSize();
            this.renderer3d = new Renderer.Renderer3D(this, this.width, this.height);
            this.renderer3d.init();
            this.renderer3d.animate();

            //Initialize models factory
            this.modelsFactory = new ModelsFactory.ModelsFactory(this);

            __d__.addEventLnr(window, "resize", function () {
                me.updateSize();
            });
        }
    }, {
        key: 'updateHtmlTitle',
        value: function updateHtmlTitle(vessel, departure, voyage) {
            var me = this,
                title = undefined;

            if (!me._titleNode) {
                return;
            }

            title = (vessel ? vessel : "") + (departure ? " / " + departure : "") + (voyage ? " / " + voyage : "");

            if (title) {
                me._titleNode.innerHTML = title;
                document.title = title + " / " + document.title;
            } else {
                me._titleNode.style.display = "none";
            }
        }
    }, {
        key: 'getDimensions',
        value: function getDimensions() {
            return { width: this.width, height: this.height };
        }
    }, {
        key: '_setDimensions',
        value: function _setDimensions(w, h) {
            this.width = w;
            this.height = h;
        }
    }, {
        key: 'updateSize',
        value: function updateSize() {
            var divMainC = undefined,
                par = undefined,
                ev = undefined,
                dim = undefined,
                w = undefined,
                h = undefined;

            divMainC = this._node;
            par = divMainC.parentNode;

            if (par === null || par === undefined) {
                return;
            }

            dim = this.getDimensions();
            w = par.offsetWidth;
            h = par.offsetHeight;

            if (dim.width !== w || dim.height !== h) {
                divMainC.style.width = w + "px";
                divMainC.style.height = h + "px";
                if (this.renderer3d) {
                    this.renderer3d.resize3DViewer(w, h);
                }
                this._setDimensions(w, h);

                ev = __d__.addEventDsptchr("resize");
                this._node.dispatchEvent(ev);
            }
        }
    }, {
        key: 'pauseRendering',
        value: function pauseRendering() {
            if (this.renderer3d) {
                this.renderer3d._isRendering = false;
            }
        }
    }, {
        key: 'resumeRendering',
        value: function resumeRendering() {
            if (this.renderer3d) {
                this.renderer3d._isRendering = true;
            }
        }

        //Generate screenshots
        //Returns an image/data format
    }, {
        key: 'generateScreenshot',
        value: function generateScreenshot() {
            var width = arguments.length <= 0 || arguments[0] === undefined ? this.options.screenshots.width : arguments[0];
            var height = arguments.length <= 1 || arguments[1] === undefined ? this.options.screenshots.height : arguments[1];
            var format = arguments.length <= 2 || arguments[2] === undefined ? this.options.screenshots.format : arguments[2];
            var transparent = arguments.length <= 3 || arguments[3] === undefined ? this.options.screenshots.transparent : arguments[3];

            //...TBD

            return data;
        }
    }]);

    return VesselsApp3D;
})();

exports.VesselsApp3D = VesselsApp3D;

},{"../utils/dom-utilities.js":10,"../utils/js-helpers.js":11,"../utils/preloader.js":12,"./data-loader.js":2,"./i18labels.js":3,"./models-factory.js":4,"./renderer.js":5}],7:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var fontHeightCache = {};

var CanvasText = (function () {
  function CanvasText() {
    _classCallCheck(this, CanvasText);

    this.textWidth = null;
    this.textHeight = null;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 128;
    this.canvas.height = 128;
    this.ctx = this.canvas.getContext('2d');
  }

  _createClass(CanvasText, [{
    key: 'drawText',
    value: function drawText(text, ctxOptions) {

      this.ctx.font = ctxOptions.font;
      this.textWidth = Math.ceil(this.ctx.measureText(text).width);
      this.textHeight = getFontHeight(this.ctx.font);

      //this.canvas.width = THREE.Math.nextPowerOfTwo(this.textWidth)
      //this.canvas.height = THREE.Math.nextPowerOfTwo(this.textHeight)
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = ctxOptions.fillStyle;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      //this.ctx.

      this.ctx.font = ctxOptions.font;
      this.ctx.fillStyle = "#000";
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

      return this.canvas;
    }
  }, {
    key: 'width',
    get: function get() {
      return this.canvas.width;
    }
  }, {
    key: 'height',
    get: function get() {
      return this.canvas.height;
    }
  }]);

  return CanvasText;
})();

function getFontHeight(fontStyle) {
  var result = fontHeightCache[fontStyle];

  if (!result) {
    var body = document.getElementsByTagName('body')[0];
    var dummy = document.createElement('div');

    var dummyText = document.createTextNode('span');
    dummy.appendChild(dummyText);
    dummy.setAttribute('style', 'font:' + fontStyle + ';position:absolute;top:0;left:0');
    body.appendChild(dummy);
    result = dummy.offsetHeight;

    fontHeightCache[fontStyle] = result;
    body.removeChild(dummy);
  }

  return result;
}

module.exports = CanvasText;

},{}],8:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var textAlign = require('./textAlign.js'),
    CanvasText = require('./CanvasText.js');

var SpriteText2D = (function (_THREE$Object3D) {
  _inherits(SpriteText2D, _THREE$Object3D);

  function SpriteText2D() {
    var text = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, SpriteText2D);

    _get(Object.getPrototypeOf(SpriteText2D.prototype), 'constructor', this).call(this);

    this._font = options.font || '30px Arial';
    this._fillStyle = options.fillStyle || '#FFFFFF';

    this.canvas = new CanvasText();

    this.align = options.align || textAlign.center;

    // this._textAlign = options.align || "center"
    // this.anchor = Label.fontAlignAnchor[ this._textAlign ]
    this.antialias = typeof (options.antialias === "undefined") ? true : options.antialias;
    this.text = text;
  }

  _createClass(SpriteText2D, [{
    key: 'updateText',
    value: function updateText() {
      this.canvas.drawText(this._text, {
        font: this._font,
        fillStyle: this._fillStyle
      });

      // cleanup previous texture
      this.cleanUp();

      this.texture = new THREE.Texture(this.canvas.canvas);
      this.texture.needsUpdate = true;
      this.applyAntiAlias();

      if (!this.material) {
        this.material = new THREE.SpriteMaterial({ map: this.texture });
      } else {
        this.material.map = this.texture;
      }

      if (!this.sprite) {
        this.sprite = new THREE.Sprite(this.material);
        this.geometry = this.sprite.geometry;
        this.add(this.sprite);
      }

      //this.sprite.scale.set(this.canvas.width, this.canvas.height, 1)

      //this.sprite.position.x = ((this.canvas.width/2) - (this.canvas.textWidth/2)) + ((this.canvas.textWidth/2) * this.align.x)
      //this.sprite.position.y = (- this.canvas.height/2) + ((this.canvas.textHeight/2) * this.align.y)
    }
  }, {
    key: 'cleanUp',
    value: function cleanUp() {
      if (this.texture) {
        this.texture.dispose();
      }
    }
  }, {
    key: 'applyAntiAlias',
    value: function applyAntiAlias() {
      if (this.antialias === false) {
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.LinearMipMapLinearFilter;
      }
    }
  }, {
    key: 'width',
    get: function get() {
      return this.canvas.textWidth;
    }
  }, {
    key: 'height',
    get: function get() {
      return this.canvas.textHeight;
    }
  }, {
    key: 'text',
    get: function get() {
      return this._text;
    },
    set: function set(value) {
      if (this._text !== value) {
        this._text = value;
        this.updateText();
      }
    }
  }, {
    key: 'font',
    get: function get() {
      return this._font;
    },
    set: function set(value) {
      if (this._font !== value) {
        this._font = value;
        this.updateText();
      }
    }
  }, {
    key: 'fillStyle',
    get: function get() {
      return this._fillStyle;
    },
    set: function set(value) {
      if (this._fillStyle !== value) {
        this._fillStyle = value;
        this.updateText();
      }
    }
  }]);

  return SpriteText2D;
})(THREE.Object3D);

module.exports = SpriteText2D;

},{"./CanvasText.js":7,"./textAlign.js":9}],9:[function(require,module,exports){
"use strict";

module.exports = {
  center: new THREE.Vector2(0, 0),
  left: new THREE.Vector2(1, 0),
  topLeft: new THREE.Vector2(1, -1),
  topRight: new THREE.Vector2(-1, -1),
  right: new THREE.Vector2(-1, 0),
  bottomLeft: new THREE.Vector2(1, 1),
  bottomRight: new THREE.Vector2(-1, 1)
};

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
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

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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
