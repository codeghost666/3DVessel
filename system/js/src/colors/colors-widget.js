var __s__ = require('../utils/js-helpers.js'),
    __d__ = require('../utils/dom-utilities.js'),
    i18labels = require('../core/i18labels.js');

//Class ColorsWidget
export class ColorsWidget {
    constructor(btn, filters, referenz = null) {
        
        this.isOpened = false;
        this.btn = btn;
        this.referenz = referenz;
        this.filters = filters || {};

        this._currentOption = null;

        this._node = (function(){
            let divMainC, dropdwn, ulColors, btnSave, btnCancel, colorPickerDiv, colorPickerJoe,
                key, filter, arrLis = [], divHolder,
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
            for(key in filters) {
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
            return divMainC;       
        }());

        //Optional callbacks
        this.onToggled = null;
        this.onSaved = null;

        this._jsonColors = {};

        __d__.addEventLnr(btn, "click", this.toggleHandler.bind(this));
        __d__.addEventLnr(this._node.dropdwn, "change", this.dropFilterChanged.bind(this));
        __d__.addEventLnr(this._node.btnCancel, "click", this.close.bind(this));
        __d__.addEventLnr(this._node.btnSave, "click", this.saveColors.bind(this));
        __d__.addEventLnr(this._node.ulColors, "click", this.selectOption.bind(this));
    }

    //Updates filters with json.colors
    mergeColorSettings(json) {
        let jsonObj = json, key, color, key2, 
            filters = this.filters;

        if (typeof(json) === "String") { jsonObj = JSON.parse(json); }
        if (!jsonObj.colors) { console.error(i18labels.NO_COLOR_SETTINGS); return; }

        for (key in jsonObj.colors) {            
            if (!filters[key]) { continue; }

            for (key2 in jsonObj.colors[key]) {
                if (!filters[key].obs.hasOwnProperty(key2)) { continue; }

                color = jsonObj.colors[key][key2];
                filters[key].obs[key2].color = color;
                filters[key].obs[key2].hexColor = parseInt(color.replace(/^#/, ''), 16);
                filters[key].obs[key2].colorIsRandom = false;
            }
        }

        this._jsonColors = jsonObj.colors;
    }

    toggleHandler(ev) {
        this.toggle(!this.isOpened);
    }

    close() {
        this.toggle(false);
    }

    toggle(doOpen = true) {
        let filters = this.filters;
        this._node.style.display = doOpen ? "block" : "none";
        this.isOpened = doOpen;

        if (!doOpen) { if (this.onToggled) { this.onToggled(false); } return; }

        //Following code when the widget is opened
        this._node.colorsTemp = {};

        if (this.referenz && this.referenz.value !== "" && filters[this.referenz.value]) {
            this._node.dropdwn.value = this.referenz.value;
        }

        //Populate color options
        this.dropFilterChanged();

        //If callback
        if (this.onToggled) { this.onToggled(true); }

    }

    dropFilterChanged () {
        let me = this,
            arr = [], key,
            tfLabels = { "0" : "no", "1": "yes" },
            filterKey = this._node.dropdwn.value,
            currFilter = this.filters[filterKey],
            lis, firstLi, currColor;

        for (key in currFilter.obs) {
            currColor = me._node.colorsTemp[filterKey + "." + key ] || currFilter.obs[key].color;
            arr.push("<li data-color='" + currColor + "' id='liColor_" + filterKey + "." + key + "'><span style='background:" +
                currColor + "'> </span>" + 
                (currFilter.tf ? tfLabels[key] : key) + "&nbsp;</li>");
        }

        this._node.ulColors.innerHTML = arr.join("");
        lis = this._node.ulColors.getElementsByTagName("LI");
        if (!lis || lis.length === 0) { return; } 
        
        firstLi = lis[0];
        firstLi.className = "selected"; 
        this._currentOption = firstLi;
        
        //Initialize colorPicker
        if (!this._node.colorPickerJoe) {
            this._node.colorPickerJoe = colorjoe.rgb(this._node.colorPickerDiv, firstLi.getAttribute("data-color"));
            this._node.colorPickerJoe.on("change", function(color) {
                me._currentOption.setAttribute("data-color", color.hex());
                me._currentOption.getElementsByTagName("SPAN")[0].style.background = color.hex();
                me._node.colorsTemp[me._currentOption.id.replace("liColor_", "")] = color.hex();
            });
        } else {
            this._node.colorPickerJoe.set(firstLi.getAttribute("data-color"));
        }
        
    }

    selectOption(ev) {
        let me = this,
            li = ev.target,
            lis, j, lenJ;

        if (li.tagName !== "LI") { return; }
        lis = this._node.ulColors.getElementsByTagName("LI");
        if (li.className === "selected") { return; }

        for (j = 0, lenJ = lis.length; j < lenJ; j += 1) {
            if (li !== lis[j]) {
                lis[j].className = "";
            }
        }

        setTimeout(function() {
            li.className = "selected";
            me._node.colorPickerJoe.set(li.getAttribute("data-color"), true);
            me._currentOption = li;
        }, 150);
    }

    saveColors() {
        let key, 
            colorsTemp = this._node.colorsTemp,
            filters = this.filters, filtersCustomized = {},
            arr, color;

        for (key in colorsTemp) {
            arr = key.split(".");
            if (arr.length !== 2) { continue; }

            color = colorsTemp[key];
            filters[arr[0]].obs[arr[1]].color = color;
            filters[arr[0]].obs[arr[1]].hexColor = parseInt(color.replace(/^#/, ''), 16);
            filters[arr[0]].obs[arr[1]].colorIsRandom = false;

            if (!filtersCustomized[arr[0]]) { filtersCustomized[arr[0]] = true; }
        }

        this.close();

        if (this.onSaved) {
            this.onSaved(filters, colorsTemp, filtersCustomized);
        }        
    }

}