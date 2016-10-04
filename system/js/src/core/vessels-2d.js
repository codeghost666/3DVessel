var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');
var Preloader = require('../utils/preloader.js');
var DataLoader = require('./data-loader.js');
var ModelsFactory = require('./models-factory.js');
var i18labels = require('./i18labels.js');

//Class VesselsApp2D
export class VesselsApp2D {

    constructor (btnLaunch, opts = {}) {

        let me = this;

        const version = 1.0;

        this.options = __s__.extend({
            loaderColor: "#f2f2f2",
            loaderColorSucess: "#79e3da",
            sizes: [
                { name: "Letter", w: 8.5, h: 11.0 },
                { name: "Legal", w: 8.5, h: 14.0 },
                { name: "A4", w: 8.3, h: 11.7 },
                { name: "A3", w: 11.7, h: 16.5 }
            ],
            dpis: [
                { name: "300 dpi", res: 300 },
                { name: "600 dpi", res: 600 }
            ],
            padding: { w: 0.06, h: 15.0 },
            aboveBelowSep: 2,
        }, opts);

        this._node = (function(){
            let divMainC, divForm, divProgress,
                dropdwnOr, dropdwnSz, dropdwnDp, dropdwnRw, dropdwnClr, spanOr,
                ulColors, btnSave, btnCancel, colorPickerDiv, colorPickerJoe,
                key, filter, arrLis = [], divHolder, k,
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
            for(key in me.options.dpis) {
                filter = me.options.dpis[key];
                arrLis.push("<option value='" + key + "'>" + filter.name + "</option>");
            }
            dropdwnDp.innerHTML = arrLis.join("");

            //Sizes
            dropdwnSz = document.createElement("SELECT");
            dropdwnSz.id = baseId + "-dropdwn-sizes";
            divHolder.appendChild(dropdwnSz);

            arrLis = [];
            for(key in me.options.sizes) {
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
        }());

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

        
    }//constructor

    loadUrl (jsonUrl, loadingMessage, progressCallback) {
        return this.dataLoader.loadUrl(jsonUrl, loadingMessage, progressCallback);
    }

    loadData (jsonObj) {
        return this.dataLoader.generateStructuredData(jsonObj);
    }

    _init () {
        let me = this, j, lenJ, mod;

        //Initialize models factory
        this.modelsFactory = new ModelsFactory.ModelsFactory(this);
    }

    dropFilterChanged() {
        let res = this.options.dpis[this._node.dropdwnDp.value].res,
            size = this.options.sizes[this._node.dropdwnSz.value],
            arrLis, k,
            rws, bayW,
            dropdwnRw = this._node.dropdwnRw,
            optsPaddingW = this.options.padding.w, paddingW;

        this.width =  res * size[this._node.dropdwnOr.value === "1" ? "w" : "h"];
        this.height = res * size[this._node.dropdwnOr.value !== "1" ? "w" : "h"];

        arrLis = [];
        arrLis.push("<option value='1'>" + i18labels.PRINTOPTS_PERROW + ": 1</option>");
        for(k = 2; k < 16; k +=1) {
            bayW = Math.round(this.width / (k * (1 + optsPaddingW)));
            if (bayW < res * 0.3) { break; }
            arrLis.push("<option data-w='" + bayW + "' value='" + k + "'>" + i18labels.PRINTOPTS_PERROW + ": " + k + "</option>");
        }
        dropdwnRw.innerHTML = arrLis.join("");
        dropdwnRw.selectedIndex = Math.floor(arrLis.length / 2);                      

    }

    applyColorsFilter(filters) {
        let arrLis = [], key, filter;
        for(key in filters) {
            filter = filters[key];
            arrLis.push("<option value='" + key + "'>" + i18labels.PRINTOPTS_COLORBY + ": " + filter.name + "</option>");
        }
        this._node.dropdwnClr.innerHTML = arrLis.join("");  
    }

    toggleHandler(ev) {
        this.toggle(!this.isOpened);
    }

    close() {
        this.toggle(false);
    }

    toggle(doOpen = true) {
        this._node.style.display = doOpen ? "block" : "none";
        this.isOpened = doOpen;

        if (!doOpen) { if (this.onToggled) { this.onToggled(false); } return; }

        this._node.divForm.style.display = "block";
        this._node.divProgress.style.display = "none";

        //Populate color options
        this.dropFilterChanged();

        //If callback
        if (this.onToggled) { this.onToggled(true); }

    }

    launchPdfStart() {
        let rws = this._node.dropdwnRw.value,
            res = this.options.dpis[this._node.dropdwnDp.value].res,
            filterBy = this._node.dropdwnClr.value,
            w = this.width,
            h = this.height;
        
        this.pdfStart(rws, res, w, h, filterBy);
    }

    pdfStart(rws, res, width, height, filterBy, inchFactor) {
        let me = this,
            aboveBelowSep = this.options.aboveBelowSep,
            data = this.data,
            dataStructured = data.dataStructured,
            hasZeroCell = data.hasZeroCell,
            maxH, maxW, j, lenJ,
            positionsX = [0],
            bayW, bayH, nextBayH,
            contHeight = 8, contWidth = 8,
            paddingW, optsPaddingW = me.options.padding.w,
            maxCell, cellsWidth, mapCells = {}, mapTiers = {}, tierH = 0,
            bayImages = [], canvasPage, ctxPage, pageX, pageY,
            divForm = this._node.divForm,
            divProgress = this._node.divProgress,
            labelsTopHeight = 5,
            labelsLeftWidth = 5,
            boxW, boxH, boxTimesH, boxTop, boxLeft,    
            fontFactor = 1;

        function drawContainer(obj, inchFactor = me.inchFactor, noColor = false) {
            let canvas = document.createElement("canvas"), ctx, color, txt; 
            
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
        
            if (!obj.s) { //Not full
                txt = "e";
            } 
            if (obj.r) { //Reefer
                txt = "r";
            }

            if (txt) {
                let calcFactor = fontFactor * inchFactor / me.inchFactor;
                if (rws < 7) { calcFactor = calcFactor + (8 - rws) * 0.2; }
                ctx.font = (13 * calcFactor) + "px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "#333333";
                ctx.fillText(txt, 4 * inchFactor, 7 * inchFactor);
            }

            if (obj.w) { //Hazardous
                ctx.strokeStyle = "#666666";
                ctx.lineWidth = 1;
                ctx.moveTo(0, contHeight * inchFactor / 2);
                ctx.lineTo(contWidth * inchFactor / 2, 0);
                ctx.lineTo(contWidth * inchFactor, contHeight * inchFactor / 2);
                ctx.lineTo(contWidth * inchFactor / 2, contHeight * inchFactor);
                ctx.lineTo(0, contHeight * inchFactor / 2);
                ctx.stroke();
            }

            if (obj.h === 9.5) { //High-cube
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

            if (obj.x) { //OOG
                ctx.fillStyle = "#333333";
                ctx.beginPath();
                ctx.arc(contWidth * inchFactor, contHeight * inchFactor / 4 * 3, 2 * inchFactor, 0, 1.5 * Math.PI);
                ctx.fill();
            }

            switch (obj.l) { //Length
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
            let t, tier, c, cell, dataBay = dataStructured[key], dataBay2,
                cnv, ctx, y, x, titleT = key,           
                contWidthCenter = Math.round(contWidth / 2) * me.inchFactor,
                contHeightFactored = contHeight * me.inchFactor,
                contWidthFactored = contWidth * me.inchFactor;

            cnv = document.createElement("canvas");
            cnv.width = (bayW + labelsLeftWidth * 2 * me.inchFactor);
            cnv.height = (maxH * me.inchFactor + labelsTopHeight * 2 * me.inchFactor);
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
            ctx.font = (24 * fontFactor) + "px Georgia";
            ctx.textAlign = "center";
            ctx.fillText(titleT, bayW / 2, Math.max(labelsTopHeight / 2 * me.inchFactor, 20));

            ctx.font = (10 * fontFactor) + "px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#666666";
            ctx.strokeStyle = "#dddddd"
            ctx.lineWidth = 2 * me.lineWidth;
            ctx.save();

            console.log( "Step 1, Bay " + key);

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
                    let cnt = drawContainer(cell.tiers[t]);
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
                            if (cell.tiers[t].iBay & 1) { continue; }
                            x = (mapCells[Number(c)] + labelsLeftWidth) * me.inchFactor;
                            y = (mapTiers[Number(t)] - contHeight + labelsTopHeight) * me.inchFactor;
                            let cnt = drawContainer(cell.tiers[t]);
                            ctx.drawImage(cnt, x, y);
                        }
                    }
                }
            }

            return cnv;
                
        }

        function drawLegend() {
            let f, cnv, ctx, 
                x = 0, 
                y = 0,
                xInit = Math.round(6 * me.inchFactor),
                yInit = Math.round(labelsTopHeight * me.inchFactor * 2),
                yAdd = Math.round(14 * me.inchFactor),
                xPad = Math.round(20 * me.inchFactor),
                maxX = 0,
                obs, obj;

            cnv = document.createElement("canvas");
            cnv.width = (bayW + labelsLeftWidth * 2 * me.inchFactor);
            cnv.height = (maxH * me.inchFactor + labelsTopHeight * 2 * me.inchFactor);
            ctx = cnv.getContext("2d");

            ctx.font = (19 * fontFactor) + "px Arial";
            ctx.textAlign = "left";
            ctx.fillStyle = "#444444";
            
            y = yInit;
            x = xInit;
            for (f in data.filters[filterBy].obs) {
                obs = data.filters[filterBy].obs[f];
                obj = { s: 1};
                obj[filterBy] = f;
                ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6), x, y);
                ctx.fillText(f, x + 16 * me.inchFactor, y + 8 * me.inchFactor);
                maxX = Math.round(Math.max(maxX, ctx.measureText(f).width));
                y += yAdd;
                if (y + yAdd > cnv.height) { y = yInit; x += xInit + xPad + maxX; }
            }

            y = yInit; x += xInit + xPad + maxX;

            //Add Hazardous
            obj = { s: 1, w: 1};
            obj[filterBy] = "";
            ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
            ctx.fillText("Hazardous", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
            y += yAdd;

            //Add Empty
            obj = { s: 0};
            obj[filterBy] = "";
            ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
            ctx.fillText("Empty", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
            y += yAdd;
            
            //Add Reefer
            obj = { s: 1, r: 1};
            obj[filterBy] = "";
            ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
            ctx.fillText("Reefer", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
            y += yAdd;
            
            //Add High-cube
            obj = { s: 1, h: 9.5};
            obj[filterBy] = "";
            ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
            ctx.fillText("High-cube", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
            y += yAdd;
            
            //Add 40-footer
            obj = { s: 1, l: 40};
            obj[filterBy] = "";
            ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
            ctx.fillText("40-footer", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
            y += yAdd;
            
            //Add 45-footer
            obj = { s: 1, l: 45};
            obj[filterBy] = "";
            ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
            ctx.fillText("45-footer", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
            y += yAdd;

            //Add OOG
            obj = { s: 1, x: 1};
            obj[filterBy] = "";
            ctx.drawImage(drawContainer(obj, me.inchFactor * 1.6, true), x, y);
            ctx.fillText("OOG", x + 16 * me.inchFactor, y + 8 * me.inchFactor);
            y += yAdd;            
            
            return cnv;
        }

        function sendPagesToServer() {
            let postUrl = me.postUrl, reqUpload, json, isLndscp,
                j, lenJ,
                ajaxError = (err) => { 
                    console.error(err);
                    if (divProgress) { divProgress.innerHTML = "An error has ocurred."; }  
                },
                handlerUpload = (e) => {
                    if (e.lengthComputable) {
                        var percentage = Math.round((e.loaded * 100) / e.total);
                        divProgress.innerHTML = e.loaded < e.total ? percentage + "%" : "Finishing, please wait..." ;
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

        function receivePdfFromServer(res) {

        }

        //Show progress
        if (divForm) { divForm.style.display = "none"; }
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
        for(j = 1; j < rws; j += 1) { positionsX[j] = positionsX[j - 1] + bayW + paddingW; }

        //Bay dimensions
        bayH = (maxH + contHeight) * this.inchFactor;
        nextBayH = bayH + me.options.padding.h * this.inchFactor;
        boxW = bayW * rws + paddingW * (rws - 1);

        boxTimesH = Math.min(Math.floor(height / nextBayH), Math.ceil(data.dataStructuredKeysArr.length / rws));
        boxH = boxTimesH * bayH + (boxTimesH - 1) * me.options.padding.h * this.inchFactor;

        boxTop  = Math.round((height - boxH) / 2);
        boxLeft = Math.round((width - boxW) / 2);

        //console.log("Dimensions", { bayW, bayH, nextBayH, boxW, boxH, boxLeft, boxTop });

        //Cells positions
        maxCell = Number(_.max(data.dataStructured, (k) => k.maxCell).maxCell);
        cellsWidth = (maxCell + (hasZeroCell ? 1 : 0)) * contWidth;
        let lPos = 0, rPos = cellsWidth - contWidth;
        for(j = maxCell, lenJ = hasZeroCell ? 0 : 1; j >= lenJ; j -= 1) {
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
        for(j = data.iTierMin, lenJ = data.iTierMax; j <= lenJ; j += 2) {
            mapTiers[j] = maxH - tierH;
            tierH += contHeight;
        }
        tierH += aboveBelowSep * 2;
        for(j = data.iTierMinAbove, lenJ = data.iTierMaxAbove; j <= lenJ; j += 2) {
            mapTiers[j] = maxH - tierH;
            tierH += contHeight;
        }

        //Prepare 1st page
        canvasPage = document.createElement("canvas");
        canvasPage.width = width; canvasPage.height = height;
        ctxPage = canvasPage.getContext("2d");
        pageY = 0;

        setTimeout(function() {
            //Iterate bays & pages
            for (let j = 0, lenJ = data.dataStructuredKeysArr.length ; j < lenJ; j += 1) {
                let bayInfo = data.dataStructuredKeysArr[j];
                if (!bayInfo) { continue;} 

                let im = drawBay(data.dataStructuredKeysArr[j]);
                ctxPage.drawImage(im, positionsX[j % rws] + boxLeft, pageY + boxTop);

                if ((j+1) % rws === 0 || (j + 1) === lenJ) {
                    pageY += nextBayH;
                    if (pageY + nextBayH > height || (j + 1) === lenJ) { 
                        
                        bayImages.push(canvasPage);
                        
                        if (j + 1 < lenJ) {
                            canvasPage = document.createElement("canvas");
                            canvasPage.width = width; canvasPage.height = height;
                            ctxPage = canvasPage.getContext("2d");
                            pageY = 0;
                        } else {
                            if ((j+1) % rws !== 0) { pageY -= nextBayH; }                            
                            ctxPage.drawImage(drawLegend(), 
                                Math.round(positionsX[(j + 1) % rws] + boxLeft), 
                                Math.round(pageY + boxTop));
                        }
                    }
                }            
            }

            divProgress.innerHTML = i18labels.PRINTOPTS_SENDINGPAGES;
            sendPagesToServer();

        }, 50);

        window.pagess = bayImages;
    }

    setTitle (vessel, departure, voyage) {
        let title = (vessel ? vessel : "") + 
                (departure ? " / " + departure : "") +
                (voyage ? " / " + voyage : "");

        if (title) {
            this.title = title;
        }
    }


      
}