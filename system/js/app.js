var appContainersSaants = (function () {
    "use strict";

    var THREE = window.THREE || {},
        Detector = window.Detector || {},
        Stats = window.Stats || {},
        console = window.console || { log: function () {} },
        TweenLite = window.TweenLite,
        Power1 = window.Power1,
        Power2 = window.Power2,
        Power3 = window.Power3,
        
        cfg = { winH: 0, winW: 0, dampingFactorOut: 0.2, dampingFactorIn: 0.75},
        
        creditsControl,
        modelsCreator,
        dataLoader,
        preloaderHelper,
        controlsControl,
        RColor,
        stats,
        light,
        camera,
        controls,
        scene,
        renderer,
        raycaster, mouseVector, 
        INTERSECTED,
        is3DRendering = true,
        
        infoWindow = document.getElementById("info-window"),
        titleBay = document.getElementById("titleBay"),
        
        g3Bays = {},
        onError = function (xhr) { console.error('An error happened loading assets'); },
        objLoader,
        mtlLoader,
        texturesLength = 0,
        textures = [],
        font,
        currCat = null,
        noRendering = null,
        extraSep = 0.5,
        data, urlData = "NYKDemeter022W.js", urlPath = "system/json/", queryParams,
        dataStructured, containersIDs = {}, allContainerMeshesObj = {},
        filters, initialCameraPosition,
        belowTiers, aboveTiers, maxDepth = 0, maxWidth = 0,
        winSize = function () {
            var w = window,
                d = document,
                e = d.documentElement,
                g = d.getElementsByTagName('body')[0],
                x = w.innerWidth || e.clientWidth || g.clientWidth,
                y = w.innerHeight || e.clientHeight || g.clientHeight;
            cfg.winW = x - 240;
            cfg.winH = y;
        };
    
    function addEvent(obj, type, fn) {
        if (obj.attachEvent) {
            obj['e' + type + fn] = fn;
            obj[type + fn] = function () { obj['e' + type + fn](window.event); };
            obj.attachEvent('on' + type, obj[type + fn]);
        } else {
            obj.addEventListener(type, fn, false);
        }
    }
    
    function decimalToHex(d) {
        var hex = Number(d).toString(16);
        hex = "000000".substr(0, 6 - hex.length) + hex;
        return hex.toUpperCase();
    }
    
    function sortNumeric(a, b) {
        if (Number(a) < Number(b))
            return -1;
        else if (Number(a) > Number(b))
            return 1;
        else 
            return 0;
    }
    
    function objKeysToArray(obj, sortN) {
        var key, arr = [];
        for(key in obj) {
            arr.push(key);
        }
        if (sortN) {
            arr = arr.sort(sortNumeric);
        }
        return arr;
    } 
   
    function pad(num, size) {
        var s = "000" + String(num);
        return s.substr(s.length - size);
    }
    
    queryParams = (function getQueryParams() {
        var qs = document.location.search.split('+').join(' ');

        var params = {},
            tokens,
            re = /[?&]?([^=]+)=([^&]*)/g;

        while (tokens = re.exec(qs)) {
            params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        }
        return params;
    }());  
    
    RColor = function() {
		this.hue			= Math.random(),
		this.goldenRatio 	= 0.618033988749895;
		this.hexwidth		= 2;
        
        this.hsvToRgb = function (h,s,v) {
            var	h_i	= Math.floor(h*6),
                f 	= h*6 - h_i,
                p	= v * (1-s),
                q	= v * (1-f*s),
                t	= v * (1-(1-f)*s),
                r	= 255,
                g	= 255,
                b	= 255;
            switch(h_i) {
                case 0:	r = v, g = t, b = p;	break;
                case 1:	r = q, g = v, b = p;	break;
                case 2:	r = p, g = v, b = t;	break;
                case 3:	r = p, g = q, b = v;	break;
                case 4: r = t, g = p, b = v;	break;
                case 5: r = v, g = p, b = q;	break;
            }
            return [Math.floor(r*256),Math.floor(g*256),Math.floor(b*256)];
        };
        
        this.padHex = function(str) {
            if(str.length > this.hexwidth) return str;
            return new Array(this.hexwidth - str.length + 1).join('0') + str;
        };
        
        this.get = function(hex,saturation,value) {
            this.hue += this.goldenRatio;
            this.hue %= 1;
            if(typeof saturation !== "number")	saturation = 0.5;
            if(typeof value !== "number")		value = 0.95;
            var rgb = this.hsvToRgb(this.hue,saturation,value);
            if(hex)
                return "#" +  this.padHex(rgb[0].toString(16))
                            + this.padHex(rgb[1].toString(16))
                            + this.padHex(rgb[2].toString(16));
            else 
                return rgb;
        };
        
	};
    
    dataLoader = {
        jsonUrl: "",
        initialBay: "",
        init: function () {
            var req = new XMLHttpRequest(), 
                theJson = document.getElementById("json").value,
                theBay = document.getElementById("bay").value,
                messages = document.getElementById("messages");
            
            function transferComplete(ev) {
                var d, lenD, j, obj, lenJ,
                    bays = {}, cells = {}, tiers = {}, hCalc, tmp,
                    bb = 0, bc = 0, bt = 0;
                    
                belowTiers = { n: 0, tiers: {} };
                aboveTiers = { n: 0, tiers: {} };
                    
                function addStructured(ob) {
                    var bay2 = ob.bay, ibay = ob.iBay;
                    if (ibay % 2 === 0) { bay2 = pad(ibay - 1, 3)} 
                    
                    if (!dataStructured[bay2]) {
                        dataStructured[bay2] = { cells: {}, n: 0};
                        dataStructured.n += 1;
                        dataStructured[bay2].maxD = 20;
                    }
                    if (!dataStructured[bay2].cells[ob.cell]) {
                        dataStructured[bay2].cells[ob.cell] = { tiers: {}, n: 0};
                        dataStructured[bay2].n += 1;
                    }
                    dataStructured[bay2].cells[ob.cell].tiers[ob.tier] = ob;
                    dataStructured[bay2].cells[ob.cell].n += 1;

                    if (maxWidth < dataStructured[bay2].n) { maxWidth = dataStructured[bay2].n; }
                    if (ob.depth > dataStructured[bay2].maxD) { dataStructured[bay2].maxD = ob.depth; }
                    if (obj.tier < "78") {
                        if(!belowTiers.tiers[obj.tier]) {
                            belowTiers.tiers[obj.tier] = { h: ob.h, accH: 0 };
                            belowTiers.n += 1;
                        }
                        if (ob.h > belowTiers.tiers[obj.tier].h) { belowTiers.tiers[obj.tier].h = ob.h; }
                    } else {
                        if(!aboveTiers.tiers[obj.tier]) {
                            aboveTiers.tiers[obj.tier] = { h: ob.h, accH: 0 };
                            aboveTiers.n += 1;
                        }
                    }
                }
                
                function addTitle (vessel, departure, voyage) {
                    var tNode = document.getElementById("titleH1"),
                        title = (vessel ? vessel : "") + (departure ? " / " + departure : "") + (voyage ? " / " + voyage : "");
                        if (title) {
                            tNode.innerHTML = title;
                            document.title = title + " / " + document.title;
                        } else {
                            tNode.style.display = "none";
                        }
                }
                
                function addFilters(ob) {
                    if (!filters.s.obs[ob.s]) { filters.s.obs[ob.s] = { c: 1, indexes: [] }; }
                    if (!filters.i.obs[ob.i]) { filters.i.obs[ob.i] = { c: 1, indexes: [] }; }
                    if (!filters.r.obs[ob.r]) { filters.r.obs[ob.r] = { c: 1, indexes: [] }; }
                    if (!filters.w.obs[ob.w]) { filters.w.obs[ob.w] = { c: 1, indexes: [] }; }
                    if (!filters.o.obs[ob.o]) { filters.o.obs[ob.o] = { c: 1, indexes: [] }; }
                    if (!filters.d.obs[ob.d]) { filters.d.obs[ob.d] = { c: 1, indexes: [] }; }
                    if (!filters.f.obs[ob.f]) { filters.f.obs[ob.f] = { c: 1, indexes: [] }; }
                    if (!filters.t.obs[ob.t]) { filters.t.obs[ob.t] = { c: 1, indexes: [] }; }
                    if (!filters.x.obs[ob.x]) { filters.x.obs[ob.x] = { c: 1, indexes: [] }; }
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
                
                try {
                    if (req.status == 200) {
                        d = JSON.parse(req.responseText);
                        data = {
                            conts: d["3DVesselData"]
                        };
                        
                        addTitle(d["VesselName"], d["PlaceOfDeparture"], d["VoyageNumber"]);
                        controlsControl.init();
                        
                        lenD = d["3DVesselData"].length;
                        dataStructured = { n: 0 };
                        for (j = 0; j < lenD; j += 1) {
                            
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
                            addFilters(obj);
                            modelsCreator.createBay(obj.bay);
                            modelsCreator.createIsoModel(obj);
                        }
                                            
                        data.info = {
                            contsL: lenD
                        }
                                    
                        modelsCreator.init();
                        controlsControl.addBaysControl();
                        console.log(dataStructured);

                        
                    } else {
                        ajaxError(req);
                    }
                }
                catch( e ) {
                    //alert('Caught Exception: ' + e.description);
                }

            }
            
            function transferProgress(evt) {
                if (evt.lengthComputable) {
                    var percentComplete = evt.loaded / evt.total;
                    preloaderHelper.divLoading.updateLoader(percentComplete, 0.5);
                }
            }
            
            function ajaxError(evt) {
                messages.innerHTML = "<span style='color:red'>" + evt.responseText + "</span>";
                console.error(evt);
                setTimeout(function() { preloaderHelper.divLoading.updateLoader(0.0, 0.5);}, 1000);
            }
            
            
            theJson = queryParams.json || (urlPath + urlData);
            if(theJson === "") {
                messages.innerHTML = "<span style='color:red'>Error: Missing data source.</span>";
                setTimeout(function() { preloaderHelper.divLoading.updateLoader(0.0, 0.5);}, 500);
                return;
            }
            
            req.open('GET', theJson + (theJson.indexOf("?") > 0 ? "&" : "?") + "t=" + (new Date()) * 1, false);
            addEvent(req, "load", transferComplete);
            addEvent(req, "progress", transferProgress);
            addEvent(req, "error", ajaxError);       
            req.send();
            
            dataLoader.jsonUrl = theJson;
            dataLoader.initialBay = theBay || queryParams.bay;
            
        }
    }; //dataLoader
    
   
    modelsCreator = {
        models: {},
        isoModels: {},
        allMaterials: [],
        basicMaterial: null,
        selectionMaterial: null,
        shipHouse: null,
        init: function () {
            if (data.info.contsL === 0) { console.warn("No data"); return; }
            this.extendSpecs();
            this.createFromData();
            this.basicMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.3, wireframe: true } );
            this.selectionMaterial = new THREE.MeshStandardMaterial( { color: 0x000000,  opacity: 1, side: THREE.DoubleSide, transparent: true} );
        },
        createBay: function (k) {
            if (!g3Bays["b" + k]) {
                g3Bays["b" + k] = new THREE.Object3D();
                g3Bays["b" + k].name = "b" + k;
                scene.add(g3Bays["b" + k]);
            }   
        },
        createIsoModel: function (obj) {
            var me = modelsCreator,
                isoModels = me.isoModels;
            
            if (!isoModels[obj.i]) {
                isoModels[obj.i] = {
                    d: obj.depth,
                    h: obj.h
                }
            }
        },
        extendSpecs: function () {
            var j, lenJ, key, val, attr, spec,
                me = modelsCreator, material, materialPos,
                rcolor = new RColor(), color, hexColor;
                
            for(key in filters) {
               attr = filters[key];
               for(val in attr.obs) {
                   color = rcolor.get(true);
                   hexColor = parseInt(color.replace(/^#/, ''), 16);
                   material = new THREE.MeshStandardMaterial({ 
                                        color: hexColor,
                                        side: THREE.DoubleSide,
                                        transparent: true,
                                        opacity: 1
                                    });
                   me.allMaterials.push(material);
                   materialPos = me.allMaterials.length - 1;
                                      
                   spec = attr.obs[val];
                   spec.color = color;
                   spec.hexColor = hexColor;
                   spec.materialPos = materialPos;
               } 
            }
            
            console.log(filters);
            me.createBaseModels();
        },
        createBaseModels: function () {
            var key, me = modelsCreator,
                isoModels = me.isoModels, isoModel, h, obj, spec,
                geom, mesh,
                me = modelsCreator;
            
            for (key in isoModels) {
                isoModel = isoModels[key];
                h = isoModel.h;
                
                obj = new THREE.Shape([
                    new THREE.Vector2( 0, 0 ),
                    new THREE.Vector2( 0, h ),
                    new THREE.Vector2( 8, h ),
                    new THREE.Vector2( 8, 0 )
                ]);
                
                geom = new THREE.ExtrudeGeometry( obj, { 
                    bevelEnabled: false,
                    steps: 1,
                    amount: isoModel.d
                });
                
                spec = filters.i.obs[key];

                mesh = new THREE.Mesh( geom, me.allMaterials[spec.materialPos] );
                mesh.materialPos = spec.materialPos;
                mesh.dynamic = true;
                me.models[key] = mesh;
            }
            
            me.showColorsTable("i");
        },
        showColorsTable: function (attr) {
            var tableColors = document.getElementById("tableColors"),
                liColors = [], key, attr, isTf, val;
                
            isTf = filters[attr].tf;
            for (key in filters[attr].obs) {
                val = filters[attr].obs[key];
                if (isTf) {
                    liColors.push("<li><span style='background:" + val.color + "'></span>" + (key==="1" ? "yes" : "no") + "</li>");
                } else {
                    liColors.push("<li><span style='background:" + val.color + "'></span>" + key + "</li>");
                }
            }
            tableColors.innerHTML = liColors.join("");
        },
        createFromData: function () {
            var j, lenJ = data.info.contsL, len,
                key, key2, key3, aCell, arrCellTiers, tierHeightAcc,
                me = modelsCreator,
                point, model, mesh, spec, h, bT, zAccum,
                x, y, z, prevBay, extraAdd, hasZeroRow, isOdd,
                floorAbove = 3, floorBelow = 3 - extraSep, lastBay,
                iBay, iCell, iTier, iTierMin, iTierMinAbove, lastBayDepth,
                g3Bay,
                tmpArr = [];
                
            function compareLocations(a, b) {
                if (a.p < b.p)
                    return -1;
                else if (a.p > b.p)
                    return 1;
                else 
                    return 0;
            }      
            
            tmpArr = [];                   
            for (key in belowTiers.tiers) {
                floorBelow += belowTiers.tiers[key].h + extraSep;
                tmpArr.push(key);
            }
            iTierMin = Number(tmpArr.sort()[0]);
            tmpArr = [];
            for (key in aboveTiers.tiers) {
                tmpArr.push(key);
            }
            iTierMinAbove = Number(tmpArr.sort()[0]);            
                        
            //Iterate bays
            tmpArr = [];
            zAccum = 0;
            for (key in dataStructured) { 
                if (key !== "n" && dataStructured.hasOwnProperty(key)){ 
                    tmpArr.push(key);
                }
            }
            tmpArr = tmpArr.sort();
            lastBay = tmpArr[tmpArr.length - 1];
            lastBayDepth = dataStructured[lastBay].maxD;

            for (j = 1, len = Math.round(Number(lastBay)); j <= len; j += 2) {
                key = pad(j, 3);

                if (!dataStructured[key]) {
                    dataStructured[key] = { cells: {}, n: 0, z: 0};
                }

                me.createBay(key);

                if (j % 2 === 1) {
                    zAccum += 22.5 + extraSep;
                }

                dataStructured[key].z = zAccum;
                g3Bays["b" + key].position.z = zAccum;
            }

            maxDepth = zAccum + lastBayDepth;
            /*
            prevBay = 0;
            for (j = 0, len = tmpArr.length; j < len; j += 1) {
                key = tmpArr[j];
                iBay = Math.round(Number(key));
                
                me.createBay(key); 
                extraAdd = iBay - prevBay > 2 ? 80 : 0;
                prevBay = iBay;
                                
                if ((iBay - 1) % 4 === 0 && iBay > 1) { 
                    zAccum += extraAdd + (dataStructured[pad(iBay - 4, 3)] ? Number(dataStructured[pad(iBay - 4, 3)].maxD) + extraSep : 80 + extraSep);
                    dataStructured[key].z = zAccum;
                    g3Bays["b" + key].position.z = zAccum;
                    maxDepth = zAccum;
                    prevBay = Number(key);
                    continue;
                }
                if ((iBay - 3) % 4 === 0) { 
                    maxDepth = extraAdd + zAccum + 20 + extraSep;
                    dataStructured[key].z = maxDepth;
                    g3Bays["b" + key].position.z = maxDepth;
                    prevBay = Number(key);
                    continue;
                }
                if (iBay === 1) { 
                    dataStructured[key].z = 0;
                    g3Bays["b" + key].position.z = 0;
                    continue;
                }
                g3Bays["b" + key].position.z = g3Bays["b" + pad(iBay - 1, 3)].position.z;
            }
            
            maxDepth += lastBayDepth;*/
            
            for (key in g3Bays) {
                if(key !== "b001" && g3Bays[key].position.z === 0) {
                   g3Bays[key].position.z = g3Bays["b" + pad(Number(key.replace("b", "")) - 1, 3)].position.z; 
                }
                g3Bays[key].originalZ = Number(g3Bays[key].position.z);
            }
            console.log(dataStructured);
            
            //Iterate heights 
            /*
            for (key in dataStructured) { 
                if (key === "n") { continue; }
                for (key2 in dataStructured[key].cells) { 
                    if (key2 === "n") { continue; }
                    aCell = dataStructured[key].cells[key2];
                    arrCellTiers = [];
                    tierHeightAcc = 0;
                    for (key3 in aCell.tiers) { 
                        if (key3 === "n") { continue; }
                        arrCellTiers.push(aCell.tiers[key3]);
                    }
                    arrCellTiers = arrCellTiers.sort(compareLocations);
                    for (j = 0, lenJ = arrCellTiers.length; j < lenJ; j += 1) {
                        if (j > 0 && arrCellTiers[j].iTier >= 78 && arrCellTiers[j - 1].iTier < 78) { tierHeightAcc = 0; }
                        arrCellTiers[j].belowHeight = tierHeightAcc;
                        tierHeightAcc += arrCellTiers[j].h + extraSep;
                    }
                }
            }*/
            
            //Iterate containers
            for (j = 0, lenJ = data.info.contsL; j < lenJ; j += 1) {
                point = data.conts[j];
                model = me.models[String(point.i)];                
                iBay = point.iBay;
                
                iCell = Number(point.cell);
                x = (iCell % 2 === 0 ? (iCell / 2) : -(iCell + 1) / 2) * (8 + extraSep); // x coordinate
                
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
            
            console.log(g3Bays);
            console.log(allContainerMeshesObj);
            me.createShipDeck();
            me.createHouse();
            
            preloaderHelper.divLoading.stopAnimation();
            setTimeout(function() {
                preloaderHelper.divLoading.style.display = "none";
                controlsControl.tryToLaunchBay(dataLoader.initialBay);
            }, 500);
        },
        createShipDeck: function () {
            var material = new THREE.LineBasicMaterial({color: 0x3d8ca8, opacity: 1, linewidth: 2 }),
                ellipse,
                ellipsePath = new THREE.CurvePath(),
                ellipseGeometry,
                line,
                maxWidthFeet = maxWidth * (8 + extraSep) / 4;
                                
            ellipsePath.add(new THREE.EllipseCurve(4, 20, maxWidthFeet, maxWidthFeet * 3, Math.PI, 0, false));
            ellipsePath.add(new THREE.EllipseCurve(4, maxDepth, maxWidthFeet, maxWidthFeet * 0.75, 0, Math.PI, false));
            ellipsePath.closePath();
            ellipseGeometry = ellipsePath.createPointsGeometry(150);
            line = new THREE.Line(ellipseGeometry, material);
            line.rotation.x = Math.PI / 2;
            scene.add(line);
        },
        createHouse: function() {
            var maxWidthFeet = maxWidth * (8 + extraSep) / 2 * 0.9,
                maxHeightFeet = Math.max(1, aboveTiers.n) * (9.5 + extraSep) + 6,
                geom, obj, mesh, rectGeom,
                hBel = Math.max(1, belowTiers.n * 0.7 ),
                hAbv = aboveTiers.n,
                yBelow = hBel * (9.5 + extraSep),
                xBelow = hBel * (8 + extraSep) / 2,
                obj3d,
                materialWindows = new THREE.MeshPhongMaterial({ color: 0x5cb2da, side: THREE.DoubleSide }),
                materialHouse = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
                
            
            obj = new THREE.Shape([
                new THREE.Vector2( 0, -yBelow ),
                new THREE.Vector2( -xBelow, -yBelow ),
                new THREE.Vector2( -maxWidthFeet, 0 ),
                new THREE.Vector2( -maxWidthFeet, maxHeightFeet),
                new THREE.Vector2( -maxWidthFeet - 0.25 * maxWidthFeet, maxHeightFeet + 10 ),
                new THREE.Vector2( -maxWidthFeet - 0.25 * maxWidthFeet, maxHeightFeet + 20 ),
                new THREE.Vector2( -maxWidthFeet, maxHeightFeet + 20),
                new THREE.Vector2( -maxWidthFeet + 0.125 * maxWidth, maxHeightFeet + 24 ),

                new THREE.Vector2( maxWidthFeet - 0.125 * maxWidth, maxHeightFeet + 24 ),
                new THREE.Vector2( maxWidthFeet, maxHeightFeet + 20),
                new THREE.Vector2( maxWidthFeet + 0.25 * maxWidthFeet, maxHeightFeet + 20 ),
                new THREE.Vector2( maxWidthFeet + 0.25 * maxWidthFeet, maxHeightFeet + 10 ),
                new THREE.Vector2( maxWidthFeet, maxHeightFeet),
                new THREE.Vector2( maxWidthFeet, 0 ),
                new THREE.Vector2( xBelow, -yBelow ),
                new THREE.Vector2( 0, -yBelow )
            ]);
            
            geom = new THREE.ExtrudeGeometry( obj, { 
                bevelEnabled: false,
                steps: 1,
                amount: 20
            });
            
            mesh = new THREE.Mesh( geom, materialHouse );
            mesh.matrixAutoUpdate = false;
            
            obj3d = new THREE.Object3D();
            obj3d.name = "house";
            obj3d.add(mesh);
            
            
            obj = new THREE.Shape([
                new THREE.Vector2( -1.125 * maxWidthFeet, 0 ),
                new THREE.Vector2( -1.125 * maxWidthFeet, 7 ),
                new THREE.Vector2( 1.125 * maxWidthFeet, 7 ),
                new THREE.Vector2( 1.125 * maxWidthFeet, 0 )
            ]);            
            
            rectGeom = new THREE.ShapeGeometry( obj );
            mesh = new THREE.Mesh( rectGeom, materialWindows );
            mesh.position.y = maxHeightFeet + 10;
            mesh.position.z = -0.25;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            obj3d.add(mesh);   
            
            mesh = new THREE.Mesh( rectGeom, materialWindows );
            mesh.position.y = maxHeightFeet + 10;
            mesh.position.z = 20.25;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            obj3d.add(mesh);    
            
            rectGeom = new THREE.SphereGeometry( 5, 32, 32 );
            mesh = new THREE.Mesh( rectGeom, materialHouse );
            mesh.position.y = maxHeightFeet + 24;
            mesh.position.z = 10;
            mesh.position.x = maxWidthFeet - 10;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();            
            obj3d.add( mesh );        
            
            rectGeom = new THREE.SphereGeometry( 5, 32, 32 );
            mesh = new THREE.Mesh( rectGeom, materialHouse );
            mesh.position.y = maxHeightFeet + 24;
            mesh.position.z = 10;
            mesh.position.x = - maxWidthFeet + 10;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();            
            obj3d.add( mesh );                   
            
            obj3d.position.x = 4;
            obj3d.position.z = -20;
            obj3d.visible = false;
            scene.add(obj3d);
            
            modelsCreator.shipHouse = { mesh: obj3d, dropdown: null, currPosBay: 0, currPosZ: 0 };
        }
    };
    
    controlsControl = {
        dropFilter: null,
        dropFilterValue: null,
        showWireframes: null,
        currentlyHidden: [],
        latestFilter: "",
        dropBays: null,
        dropBaysDictionary: {},
        openBayInfo: null,
        closeBayInfo: null,
        bayInfo: null,
        bayInfoTable: null,
        baySelected: "",
        init: function () {
            function initialize(vv, name, tf) { filters[vv] = { name: name, obs: {}, tf: tf }; }
            
            filters = {};
            initialize("i", "Container ISO", false);
            initialize("s", "Full", true);
            initialize("r", "Reefer", true);
            initialize("w", "Hazardous", true);
            initialize("t", "Tank", true);
            initialize("x", "OOG", true);
            initialize("o", "Operator", false);
            initialize("d", "Destination", false);
            initialize("f", "Load Port", false);
            
            this.addControls();
        },
        addControls: function (){
            var ctrlColors = document.getElementById("dropColors"),
                ctrlFilter = document.getElementById("dropFilter"),
                j, opt, me = controlsControl;

            me.dropFilterValue = document.getElementById("dropFilterValue"); 
            me.showWireframes = document.getElementById("showWireframesFiltered");
            me.dropFilter = ctrlFilter;
            
            opt = document.createElement("option");
            opt.value = ""; opt.innerHTML = "None";
            ctrlFilter.appendChild(opt);
            
            for(j in filters) {                
                opt = document.createElement("option");
                opt.value = j; opt.innerHTML = filters[j].name;
                ctrlFilter.appendChild(opt);
                
                opt = document.createElement("option");
                opt.value = j; opt.innerHTML = filters[j].name;
                ctrlColors.appendChild(opt);
            }
            ctrlColors.value = "i";
            
            addEvent(ctrlFilter, "change", me.prepareFilter);
            addEvent(me.dropFilterValue, "change", me.processFilterValue);
            addEvent(ctrlColors, "change", me.colorize);
            addEvent(me.showWireframes, "change", me.listenWireframeDisplay);

        },
        addBaysControl: function () {
            var key, j, lenJ, bayGroup,
                dropBays = document.getElementById("dropBays"),
                bays = [], oddB, prevOddExists, nextOddExists, oneOddExists,
                me = controlsControl, iBay,
                lis = ["<option value=''>All bays</option>"];
            
            function changeBay(ev) {
                var v = ev.target.value;
                me.isolateBay(v);
            }            
                
            for (key in g3Bays) {
                bayGroup = g3Bays[key];
                if (bayGroup.children.length > 0)
                    bays.push(bayGroup.name.replace("b", ""));
            }
            bays = bays.sort(sortNumeric);
            for (j = 0, lenJ = bays.length; j < lenJ; j +=1){
                iBay = Number(bays[j]);
                oddB = iBay % 2 === 1;
                if(oddB) {
                    lis.push("<option value='" + bays[j] + "'>" + bays[j] + "</option>");
                    me.dropBaysDictionary[bays[j]] = bays[j];
                }
                else {
                    //prevOddExists = Number(bays[j-1]) === (iBay - 1);
                    prevOddExists = (j+1) < lenJ && Number(bays[j+1]) === (iBay + 1);
                    if(!prevOddExists && !me.dropBaysDictionary[pad(iBay - 1, 3)]) {
                        lis.push("<option value='" + pad(iBay, 3) + "'>" + pad(iBay - 1, 3) + "</option>"); 
                        me.dropBaysDictionary[pad(iBay - 1, 3)] = pad(iBay, 3);
                    }
                }
            }
                        
            dropBays.innerHTML = lis.join("");
            me.dropBays = dropBays;
            addEvent(me.dropBays, "change", changeBay);
            
            me.openBayInfo = document.getElementById("open-panel");
            me.closeBayInfo = document.getElementById("close-panel");
            me.bayInfo = document.getElementById("bay-panel");
            me.bayInfoTable = document.getElementById("bay-table-container");
            
            addEvent(me.openBayInfo, "click", me.showBayInfo);
            addEvent(me.closeBayInfo, "click", me.showBayInfo);
            me.openBayInfo.style.left = "-300px";
            
            me.addHouseControl();
          
        },
        addHouseControl: function () {
            var me = controlsControl,
                dropAddHouse = document.getElementById("dropAddHouse"),
                key, bays, j, lenJ, lis = ["<option value=''>No house</option>"]; 
            
            bays = objKeysToArray(me.dropBaysDictionary);
            bays = bays.sort(sortNumeric);
            for(j = 1, lenJ = bays.length; j < lenJ; j += 1) {
                key = bays[j];
                if (dataStructured[key].maxD > 20) {
                //if((Number(key) - 1) % 4 === 0) {
                    lis.push("<option value='" + me.dropBaysDictionary[key] + "'>before " + key +"</option>");
                }
            }
            dropAddHouse.innerHTML = lis.join("");
            modelsCreator.shipHouse.dropdown = dropAddHouse;
            addEvent(dropAddHouse, "change", me.moveShipHouse);
        },
        prepareFilter: function (e) {
            var v = e.target.value, key, currentFilter, 
                opts = [ "<option value=''>Show all</option>"],
                me = controlsControl;
            
            if(!v) {
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
                for(key in currentFilter.obs) {
                    opts.push("<option value='" + key + "'>" + key + "</option>");
                }
            }
            me.dropFilterValue.innerHTML = opts.join("");
        },
        processFilterValue: function (e) {
            var v = e.target.value, 
                me = controlsControl, 
                filter = me.dropFilter, j, lenJ, key,
                showWireframes = me.showWireframes.checked,
                currentlyHidden = [], newFilterIndexes, mesh;
            
            me.pauseControls(true);
            me.showHiddenMeshes();
            if (v === "") { me.pauseControls(false); return; }
                        
            newFilterIndexes = filters[ me.dropFilter.value ].obs;
            for(key in newFilterIndexes) {
            if (me.dropFilterValue.value === key) { continue; }
                for (j = 0, lenJ = newFilterIndexes[key].indexes.length; j < lenJ; j += 1) {
                    mesh = allContainerMeshesObj[ newFilterIndexes[key].indexes[j].c ];
                    if (showWireframes) {
                        mesh.isBasic = true;
                        mesh.material = modelsCreator.basicMaterial;
                    } else {
                        mesh.visible = false;
                    }
                    currentlyHidden.push(newFilterIndexes[key].indexes[j].c);
                }
            }
            
            me.currentlyHidden = currentlyHidden;
            me.pauseControls(false);
            
        },
        processWireframeDisplay: function (toWireframes) {
            var me = controlsControl,
                currentlyHidden = me.currentlyHidden,
                j, mesh,
                lenJ = currentlyHidden.length;
                
            if (lenJ) {
                for (j = 0; j < lenJ; j += 1) {
                    mesh = allContainerMeshesObj[ currentlyHidden[j] ];
                    if (toWireframes) {
                        mesh.isBasic = true;
                        mesh.material = modelsCreator.basicMaterial;
                        mesh.visible = true;
                    } else {
                        mesh.visible = false;
                    }
                }
            }
        },
        listenWireframeDisplay: function (ev) {
            var v = ev.target.checked, 
                me = controlsControl;
                
            me.pauseControls(true);
            me.processWireframeDisplay(v);
            me.pauseControls(false);
        },
        showHiddenMeshes: function () {
            var currentlyHidden = controlsControl.currentlyHidden,
                j, mesh, obj,
                lenJ = currentlyHidden.length;
                
            if (lenJ) {
                for (j = 0; j < lenJ; j += 1) {
                    mesh = allContainerMeshesObj[ currentlyHidden[j] ];
                    if (mesh.isBasic) {
                        mesh.material = modelsCreator.allMaterials[ mesh.materialPos ];
                        mesh.isBasic = false;
                    }
                    mesh.visible = true;
                }
            }
            controlsControl.currentlyHidden = []               
        },
        pauseControls: function( disable ) {
            var me = controlsControl, prevAttr;
                
            if (disable) {
                prevAttr = me.dropFilterValue.getAttribute("disabled");
                me.dropFilter.setAttribute("disabled", "disabled");
                me.dropFilterValue.setAttribute("disabled", "disabled");
                me.dropFilterValue.setAttribute("prevAttr", prevAttr);
                me.showWireframes.setAttribute("disabled", "disabled");
                me.dropBays.setAttribute("disabled", "disabled");
                return;
            }
            //else
            prevAttr = me.dropFilterValue.getAttribute("prevAttr");
            me.dropFilter.removeAttribute("disabled");
            if(prevAttr !== "disabled") { me.dropFilterValue.removeAttribute("disabled"); }
            me.showWireframes.removeAttribute("disabled");
            me.dropBays.removeAttribute("disabled");
        },
        colorize: function (e) {
            var v = e.target.value, j, lenJ,
                mesh, obj;
            
            modelsCreator.showColorsTable(v);
            
            for (j = 0, lenJ = data.info.contsL; j < lenJ; j += 1) {
                obj = data.conts[j];
                mesh = allContainerMeshesObj[obj.cDash];
                mesh.materialPos = filters[v].obs[obj[v]].materialPos;
                if(!mesh.isBasic) { mesh.material = modelsCreator.allMaterials[ mesh.materialPos ]; }
            }
        },
        isolateBay: function(sBay) {
            
            var iBay = Number(sBay), sepZ = 40, topY = 400, newZ, me = controlsControl;
            
            function generateTable(bayToAnimate) {
                var keyCell, keyTier, iBaseBay, cell, ob, iEvenBay,
                    tableBase, tableExtraBase, cells, tiers, maxCell, tiersAcc = {},
                    sBay, sExtraBay, isEven = false,
                    j, lenJ, k, dat, htmlArr,
                    htmlTable, htmlRow, htmlCell;
                    
                function createThTable() {
                    var htmlRow = document.createElement("tr");
                    for (k = 0; k <= maxCell; k += 1) {
                        dat = pad(k, 2);
                        htmlCell = document.createElement("th");
                        htmlCell.innerHTML = dat;
                        k % 2 === 0 ?
                                htmlRow.appendChild(htmlCell) :
                                htmlRow.insertBefore(htmlCell, htmlRow.firstChild);
                    }
                    htmlRow.insertBefore(document.createElement("th"), htmlRow.firstChild);
                    htmlRow.appendChild(document.createElement("th"));
                    return htmlRow;
                }
                
                /*
                iBaseBay = (bayToAnimate - 1) % 4 === 0 ? bayToAnimate : bayToAnimate - 2;*/
                iBaseBay = bayToAnimate;
                if (iBaseBay % 2 === 0) { isEven = true; iBaseBay -= 1;}

                iEvenBay = bayToAnimate - 1;
                if (!g3Bays["b" + pad(iEvenBay, 3)]) { iEvenBay += 2; }
                if (!g3Bays["b" + pad(iEvenBay, 3)]) { iEvenBay = 0; }
                
                sBay = pad(iBaseBay, 3);
                sExtraBay = pad(bayToAnimate, 3);
                tableBase = JSON.parse(JSON.stringify(dataStructured[sBay])); //deep copy
                
                if (iBaseBay !== bayToAnimate) { //Mid bay like 3, 7, 11,...
                    tableExtraBase = JSON.parse(JSON.stringify(dataStructured[sExtraBay])); //deep copy
                    //Remove
                    for(keyCell in tableBase.cells) {
                        cell = tableBase.cells[keyCell];
                        for(keyTier in cell.tiers) {
                            ob = cell.tiers[keyTier];
                            if (ob.p.indexOf(sBay) === 0) {
                                tableBase.cells[keyCell].tiers[keyTier] = null;
                            }
                        }
                    }
                    //Replace 
                    for(keyCell in tableExtraBase.cells) {
                        cell = tableExtraBase.cells[keyCell];
                        for(keyTier in cell.tiers) {
                            ob = cell.tiers[keyTier];
                            if (ob.p.indexOf(sExtraBay) === 0) {
                                if(!tableBase.cells[keyCell]) { tableBase.cells[keyCell] = { tiers: {} }; }
                                tableBase.cells[keyCell].tiers[keyTier] = ob;
                            }
                        }
                    }                    
                }
                
                //Find all tiers
                for(keyCell in tableBase.cells) {
                    for(keyTier in tableBase.cells[keyCell].tiers) {
                        if (!tiersAcc[keyTier]) { tiersAcc[keyTier] = 1; }
                    }
                }                

                cells = objKeysToArray(tableBase.cells, true);
                tiers = objKeysToArray(tiersAcc, true);
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
                        dat = pad(k, 2);
                        htmlCell = document.createElement("td");
                        htmlCell.id = "td_" + dat + "_" + tiers[j];
                        if(tableBase.cells[dat] && tableBase.cells[dat].tiers[tiers[j]]) {
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
                        k % 2 === 0 ?
                            htmlRow.appendChild(htmlCell) :
                            htmlRow.insertBefore(htmlCell, htmlRow.firstChild);
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
                var key, i, bayM, bayMeven, iEvenBay, addToShipHouse,
                    bayGroup;
                
                iEvenBay = bayToAnimate - 1;
                if (!g3Bays["b" + pad(iEvenBay, 3)]) { iEvenBay += 2; }
                 
                for (key in g3Bays) {
                    bayGroup = g3Bays[key];
                    i = Number(bayGroup.name.replace("b", ""));
                    if (i !== bayToAnimate && i !== iEvenBay) {
                        if(i < bayToAnimate) {
                            TweenLite.to(bayGroup.position, timing, {z: bayGroup.originalZ - addC, delay: delC, ease: Power2.easeInOut})
                        } else {
                            TweenLite.to(bayGroup.position, timing, {z: bayGroup.originalZ + addC, delay: delC, ease: Power2.easeInOut})
                        }
                    }
                }
                
                if (modelsCreator.shipHouse.mesh.visible) {
                    addToShipHouse = bayToAnimate < modelsCreator.shipHouse.currPosBay ? addC : -addC;
                    TweenLite.to(modelsCreator.shipHouse.mesh.position, timing, 
                        {z: modelsCreator.shipHouse.currPosZ + addToShipHouse, delay: delC, ease: Power2.easeInOut});
                }
                
                bayM = g3Bays["b" + pad(bayToAnimate, 3)];
                bayMeven = g3Bays["b" + pad(iEvenBay, 3)];
                if(bayM)
                    {TweenLite.to(bayM.position, timing, {y: bayY, delay:0.5, ease: Power2.easeInOut});}
                if(bayMeven)
                    {TweenLite.to(bayMeven.position, timing, {y: bayY, delay:0.5, ease: Power2.easeInOut});}
                
                return bayM.originalZ;
            }
            
            function separateBay(sBay) {
                var key, i, 
                    bayGroup, camZ, camY, camX, cY, topPos, baySelected, bayY, delayUp,
                    me = controlsControl, openBaypanelButtonZ,
                    addC, opened;
                    
                me.pauseControls(true);
                opened = me.baySelected !== "";
                if(opened) {
                    //cerramos
                    animateBays(Number(me.baySelected), 0.35, 0, 0, 0);
                    //abrimos
                    if (iBay > 0)
                        newZ = animateBays(iBay, 0.4, sepZ, .75, topY);
                } else {
                    //abrimos uno nuevo
                    newZ = animateBays(iBay, 1, sepZ, 0, topY);
                }
                
                if(sBay !== "") {
                    me.baySelected = sBay;
                    camZ = newZ + 250;
                    camY = topY;
                    camX = 0;
                    cY = topY - 10;
                    delayUp = 0.5;
                    controls.dampingFactor = cfg.dampingFactorIn;
                    openBaypanelButtonZ = 30;
                } else {
                    me.baySelected = "";
                    camZ = initialCameraPosition.z;
                    camY = initialCameraPosition.y;
                    camX = initialCameraPosition.x;
                    cY = 0;
                    newZ = initialCameraPosition.targetZ;
                    delayUp = 0;
                    controls.dampingFactor = cfg.dampingFactorOut;
                    openBaypanelButtonZ = -300;
                }                     
                TweenLite.to(camera.position, 1, {x: camX, y: camY, z:camZ, delay:delayUp, ease: Power2.easeInOut});
                TweenLite.to(controls.target, 2.0, { y: cY, x: 0, z: newZ, ease: Power2.easeInOut });
                TweenLite.to(me.openBayInfo, 1.0, { left: openBaypanelButtonZ, delay:delayUp * 4,  ease: Power2.easeInOut });
                setTimeout(function() { me.pauseControls(false);}, 2500);
            }
            
            
            separateBay(!sBay ? "" : sBay);
            if(!!sBay) {
                modelsCreator.shipHouse.dropdown.setAttribute("disabled", "disabled"); 
                generateTable(iBay);
            } else {
                modelsCreator.shipHouse.dropdown.removeAttribute("disabled"); 
            }
            

        },
        showBayInfo: function(ev) {
            
            var show = ev.target.id === "open-panel",
                me = controlsControl;
                
            if (show) {
                me.bayInfo.style.display = "block";
                is3DRendering = false;
            } else {
                me.bayInfo.style.display = "none";
                is3DRendering = true;
            }
        },
        tryToLaunchBay: function(sBay) {
            var me = controlsControl,
                iBay, tryBay;
           
            if (!sBay || sBay === "n") { return; } 
            
            if(dataStructured[sBay]) {
                me.dropBays.value = me.dropBaysDictionary[sBay];
                me.isolateBay(sBay);
                return;
            }
            
            iBay = Number(sBay);
            tryBay = pad(iBay + 1, 3);
            
            if(dataStructured[tryBay]) {
                me.dropBays.value = tryBay;
                me.isolateBay(tryBay); 
            }
                
        },
        moveShipHouse: function (ev) {
            var v = ev.target.value, key, bayGroup, i,
                me = controlsControl,
                bays, j, lenJ,
                shipHouse = modelsCreator.shipHouse;
            
            is3DRendering = false;
            if(shipHouse.currPosBay > 0) {
                for (key in g3Bays) {
                    bayGroup = g3Bays[key];
                    i = Number(bayGroup.name.replace("b", ""));
                    if(i < shipHouse.currPosBay) {
                        bayGroup.position.z += 20;
                        bayGroup.originalZ += 20;
                    }
                }
            }
            
            if(v === "") {
                shipHouse.mesh.visible = false;
                is3DRendering = true;
                return;
            }
            
            shipHouse.currPosBay = Number(v);

            for (key in g3Bays) {
                bayGroup = g3Bays[key];
                i = Number(bayGroup.name.replace("b", ""));
                if(i < shipHouse.currPosBay) {
                    bayGroup.position.z -= 20;
                    bayGroup.originalZ -= 20;
                }
            }            
                      
            shipHouse.mesh.visible = true;
            shipHouse.mesh.position.z = g3Bays["b" + v].position.z - 20;
            shipHouse.currPosZ = Number(shipHouse.mesh.position.z);

            is3DRendering = true;
            
        }
    }; //controlsControl 

    function init() {
        var geometry,
            material,
            container = document.getElementById('container'),
            mesh,
            shadowConfig;
        
        shadowConfig = {
            shadowCameraVisible: false,
            shadowCameraNear: 750,
            shadowCameraFar: 4000,
            shadowCameraFov: 30,
            shadowBias: -0.0002
        };       
 
        scene = new THREE.Scene();
        
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setClearColor(0xd2eef8);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(cfg.winW, cfg.winH);
        
        dataLoader.init();

        container.appendChild(renderer.domElement);
        
        initialCameraPosition = { x: Math.round(maxDepth * 0.75), z: Math.round(maxDepth * 0.5), y: 350};
        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 3000);
        camera.position.z = initialCameraPosition.z;
        camera.position.x = initialCameraPosition.x;
        camera.position.y = initialCameraPosition.y;
        
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = cfg.dampingFactorOut;
        controls.minPolarAngle = Math.PI / 5;
        controls.maxPolarAngle = Math.PI / 5 * 4;
        controls.maxDistance = maxDepth;
        controls.target.z = Math.round(maxDepth / 2);
        controls.enableKeys = false;
        
        initialCameraPosition.targetZ = controls.target.z;

        
        raycaster = new THREE.Raycaster();
        mouseVector = new THREE.Vector2();
    
        // lights
        
        light = new THREE.DirectionalLight(0xffffff, 0.3);
        light.position.set(-3500, 1000, 1000);
        scene.add(light);
        light = new THREE.DirectionalLight(0xffffff, 0.1);
        light.position.set(-1, -1, -1000);
        scene.add(light);
        
        light = new THREE.AmbientLight(0xffffff, 1);
        scene.add(light);
        
        var sunLight = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI/2 );
        sunLight.position.set( 1000, 2000, 1000 );
        scene.add(sunLight);
        
        addEvent(window, "resize", onWindowResize);
        addEvent(window, "mousemove", onDocumentMouseMove);
        addEvent(window, "keydown", checkKeyPressed);
        
    }
    function onWindowResize() {
        winSize();
        camera.aspect = cfg.winW / cfg.winH;
        camera.updateProjectionMatrix();
        renderer.setSize(cfg.winW , cfg.winH);
    }
    function onDocumentMouseMove(e) {
        mouseVector.x = (e.clientX / cfg.winW) * 2 - 1;
        mouseVector.y = -(e.clientY / cfg.winH) * 2 + 1;
    }
    function checkKeyPressed(e) {
        switch(e.keyCode) {
            case 27:
            
                if (controlsControl.baySelected !== "") {
                    controlsControl.dropBays.value = "";
                    controlsControl.bayInfo.style.display = "none";
                    is3DRendering = true;
                    controlsControl.isolateBay("");
                } else {
                    TweenLite.to(camera.position, 1.0, 
                        { y: initialCameraPosition.y, 
                        x: initialCameraPosition.x,
                        z: initialCameraPosition.z,
                        ease: Power2.easeInOut
                        }
                    );
                }

                break;
        };
    }
        
    function animate() {
        requestAnimationFrame(animate);
        if (!is3DRendering){ return; }
        controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true
        render();
    }
    function render() {
        var intersects, lenI, nameSel, selObj, mesh;
            
        raycaster.setFromCamera(mouseVector.clone(), camera);
        intersects = raycaster.intersectObjects(scene.children, true);
        lenI = intersects.length;
        
        if (lenI > 1) {
            nameSel = intersects[1].object.name;
            if ( nameSel !== null && nameSel !== undefined) {

                selObj = containersIDs[nameSel];
                if(selObj) {
                    if ( intersects[1].object !== INTERSECTED ) {
                        if ( INTERSECTED ) { 
                            INTERSECTED.material = INTERSECTED.isBasic ? 
                                modelsCreator.basicMaterial : modelsCreator.allMaterials[INTERSECTED.materialPos];
                        }
                        INTERSECTED = intersects[1].object;
                        if (!INTERSECTED.isBasic) { INTERSECTED.material = modelsCreator.selectionMaterial; }
            
                        infoWindow.innerHTML = "<small>id:</small> " + selObj.c + "<br />" + 
                                            "<small>iso:</small> " + selObj.i + (selObj.r ? " / Reefer" : "") + "<br />" +
                                            "<small>location:</small> " + selObj.p + "<br />" +
                                            "<small>status:</small> " + (selObj.s ? "full" : "empty") + "<br />" +
                                            "<small>hazardous:</small> " + (selObj.w ? "yes" : "no") + "<br />" +
                                            "<small>tank:</small> " + (selObj.t ? "yes" : "no") + "<br />" +
                                            "<small>OOG:</small> " + (selObj.x ? "yes" : "no") + "<br />" +
                                            "<small>operator:</small> " + selObj.o + "<br />" +
                                            "<small>port-disch.:</small> " + selObj.d + "<br />" +
                                            "<small>port-load.:</small> " + selObj.f + "<br />" +
                                            "<small>Weight:</small> " + selObj.m + "MT";
                                            
                        titleBay.innerHTML = "<small>bay</small> " + selObj.iBay;
                    }
                }
                
            } 
        }
        else {
            if ( INTERSECTED ) { 
                INTERSECTED.material = INTERSECTED.isBasic ? 
                                modelsCreator.basicMaterial : modelsCreator.allMaterials[INTERSECTED.materialPos];
                INTERSECTED = null;
            } 
        }        
        
        renderer.render(scene, camera);
    }
    
    creditsControl = {
        opened: false,
        layOver: null,
        init: function () {
            var btn = document.getElementById("credits-button"),
                btnC = document.getElementById("credits-close"),
                layOver = document.getElementById("credits-layover");
            
            this.layOver = layOver;
            addEvent(btn, "click", this.toggleCredits);
            addEvent(btnC, "click", this.toggleCredits);
            this.putEmail();
        },
        toggleCredits: function () {
            var me = creditsControl;
            me.layOver.className = me.opened ? "credits-layover" : "credits-layover open";
            me.opened = !me.opened;
        },
        putEmail: function () {
            var emm = document.getElementById("mailto");
            emm.setAttribute("href", ["mailto:", "hello", "@", "francisco-gutierrez.me"].join(""));
        }
    };//creditsControl
    
    preloaderHelper = {
        resources: [],
        totBytes: 0,
        extraBytes: 869446,
        propExtraBytes: 0,
        propImgsBytes: 0,
        
        divLoading: (function () {
            
            function rectLoader() {
                var per = node.loadCurrent,
                    startAngle = -0.4,
                    angle = per * 2 * Math.PI + startAngle,
                    cen = 70;

                ctx.clearRect(0, 0, 140, 140);

                ctx.beginPath();
                ctx.arc(cen, cen, 35, 0, 2 * Math.PI, false);
                ctx.fillStyle = '#f4f4f4';
                ctx.fill();
                ctx.lineWidth = 10;
                ctx.strokeStyle = '#f4f4f4';
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(cen, cen, 20, startAngle, angle, false);
                ctx.lineWidth = 40;
                ctx.strokeStyle = '#79e3da';
                ctx.stroke();
			}
            
            function setPixelRatio () {
                var oldWidth, oldHeight;
                if (devicePixelRatio !== backingStoreRatio) {

                    oldWidth = canv.width;
                    oldHeight = canv.height;

                    canv.width = oldWidth * ratio;
                    canv.height = oldHeight * ratio;

                    canv.style.width = oldWidth + 'px';
                    canv.style.height = oldHeight + 'px';

                    ctx.scale(ratio, ratio);
                }
            }
            
            var me = preloaderHelper,
                canv = document.createElement("canvas"),
				ctx = canv.getContext("2d"),
                node = document.getElementById("loading-div"),

                devicePixelRatio = window.devicePixelRatio || 1,
                backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                                ctx.mozBackingStorePixelRatio ||
                                ctx.msBackingStorePixelRatio ||
                                ctx.oBackingStorePixelRatio ||
                                ctx.backingStorePixelRatio || 1,
                ratio = devicePixelRatio / backingStoreRatio;
            
            canv.width = 140;
            canv.height = 140;
            setPixelRatio();
            
            node.appendChild(canv);
            node.ctx = ctx;
            node.loadCurrent = 0;

            node.updateLoader = function (per, speed) {
                TweenLite.to(node, speed, {
                    loadCurrent: per,
                    ease: Power1.easeInOut,
                    onUpdate: rectLoader
                });
            };

            node.startAnimation = function () {
                rectLoader();
                node.updateLoader(0.4, 2);
            };

            node.stopAnimation = function () {
                node.updateLoader(1, 0.25);
            };

            return node;

        }()),            
        
    };//preloaderHelper
    
    //Main
    (function(){
        if (Detector.canvas && Detector.webgl) {
            winSize();
            preloaderHelper.divLoading.startAnimation();
            init();
            animate();
            //creditsControl.init();
        } else {
            document.body.className = "no-rendering-3d";
            noRendering = document.getElementById("no-rendering");
            messages.innerHTML = ["<span>", 
                                    noRendering.getAttribute(!window.WebGLRenderingContext ? "data-gpu" : "data-webgl"),
                                    "</span>"].join("");
            //noRendering.style.display = "block";
        }
    }());
    
    return { scene: scene, data: data }


}());