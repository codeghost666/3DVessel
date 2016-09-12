var __s__ = require('../utils/js-helpers.js'),
    __d__ = require('../utils/dom-utilities.js'),
    SpriteText2D = require('../text2D/SpriteText2D.js'),
    textAlign = require('../text2D/textAlign.js');

//Class Renderer3D
export class Renderer3D {

    constructor(parent, w, h) {
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

        this.allMaterials = [];
        this.basicMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.3, wireframe: true } );
        this.selectionMaterial = new THREE.MeshStandardMaterial( { color: 0x000000,  opacity: 1, side: THREE.DoubleSide, transparent: false} );
        
    }

    init() {
        let me = this,
            material,
            light,
            lightsGroup,
            mesh,
            lightPosAn = 800,
            options = this.appScene.options;

        function prepareDirectionalLight(x, y, z) {
            let ll = new THREE.DirectionalLight(0xffffff, 0.30);
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
        
        if (this.container === null || this.container === undefined) { console.error("Container is null. Halting."); return; }
        if (!this.width) { console.error("Width is null or zero. Halting."); return; }
        if (!this.height) { console.error("Height is null or zero. Halting."); return; }
        
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
        
        light = prepareDirectionalLight(-lightPosAn,lightPosAn, -lightPosAn);
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

        __d__.addEventLnr(window, "mousemove", function (e) {
            me.mouseVector.x = (e.clientX / me.width) * 2 - 1;
            me.mouseVector.y = -(e.clientY / me.height) * 2 + 1;
        });
    }

    createBay(k) {
        let me = this, 
            holder;

        if (me.g3Bays["b" + k]) { return me.g3Bays["b" + k]; }

        //Create holder
        holder = new THREE.Group();
        holder.name = "b" + k;
        holder.iBay = Number(k);
        holder.isBlockStart = false;

        //Add to bays-array & scene
        me.g3Bays["b" + k] = holder;
        me.scene.add(holder);

        return holder;         
    }

    _addLabelsToBay(bay, posY, posZ) {
        let holderLabels,
            aboveTiersN = this.appScene.data.aboveTiers.n,
            extraSep = this.appScene.options.extraSep,
            labelScale = this.appScene.options.labelScale || 2;

        holderLabels = new THREE.Group();
        holderLabels.name = "labels";
        holderLabels.visible = false;
        bay.labelsCanBeVisible = true;

        //Create FWD/AFT Labels
        let textMesh = new SpriteText2D("FWD", { 
            align: textAlign.center,
            font: '32px Arial', 
            fillStyle: '#888888'});

        textMesh.position.z = -15;
        textMesh.scale.set(labelScale, labelScale, 1);
        holderLabels.add(textMesh);

        textMesh = new SpriteText2D("AFT", { 
            align: textAlign.center,
            font: '32px Arial', 
            fillStyle: '#888888'});

        textMesh.position.z = 60;
        textMesh.scale.set(labelScale, labelScale, 1);
        holderLabels.add(textMesh);

        //Add to Bay        
        bay.add(holderLabels);
        bay.labels = holderLabels;
        holderLabels.position.y = posY;   
        holderLabels.position.z = posZ;   

    }

    addContainerMaterial (hexColor) {
        let material = new THREE.MeshStandardMaterial({ 
            color: hexColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1
        });

        this.allMaterials.push(material);
        return this.allMaterials.length - 1;
    }

    createBaseModels (isoModels) {
        var me = this,
            key,
            isoModel, h, obj, spec,
            filters = this.appScene.data.filters,
            geom, mesh;
        
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
            this.models[key] = mesh;
        }
    }

    create3dContainersFromData (d) {
        let me = this,
        
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

            j, lenJ = data.info.contsL, len,
            key, key2, key3, aCell, arrCellTiers, tierHeightAcc,
            point, model, mesh, spec, h, bT, 
            zAccum = 0,
            x, y, z, 
            prevBay, extraAdd, hasZeroRow, isOdd,
            floorAbove = 3, floorBelow = 3 - extraSep,
            lastBay,
            iBay, iCell, iTier, lastBayDepth,
            g3Bay,
            maxDepth,
            tmpArr = [],
            compactBlockNum, keyEven, keyEvenPrev, bayEven, numContsByBlock = {},

            compareLocations = (a,b) => { a.p === b.p ? 0 : ( a.p < b.p ? -1 : 1) };           
        
        lastBay = _.max(_.keys(dataStructured));
        lastBayDepth = dataStructured[lastBay].maxD;
        floorBelow = _.reduce(belowTiers.tiers, function(memo, ob){ return memo + ob.h + extraSep; }, 0) + floorBelow;

        compactBlockNum = 0;
        //Position of Bays
        for (j = 1; j <= lastBay; j += 2) {
            key = __s__.pad(j, 3);
            keyEven = __s__.pad(j + 1, 3);
            keyEvenPrev = __s__.pad(j - 1, 3);
            bayEven = g3Bays["b" + keyEven];

            if (!dataStructured[key]) {
                dataStructured[key] = { cells: {}, n: 0, z: 0};
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
            if (numContsByBay[keyEvenPrev]) { g3Bay.isBlockStart = false; }

            if (g3Bay.isBlockStart) {
                compactBlockNum += 1;
                this._addLabelsToBay(g3Bay, 
                    aboveTiers.n * (9.5 + extraSep), //y 
                    0 //z
                ); 
            }

            //Blocks for side-by-side
            g3Bay.compactBlockNum = compactBlockNum;
            if (bayEven) { bayEven.compactBlockNum = compactBlockNum; }
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
        
        me._createShipDeck();
        me._createHouse(aboveTiers.n);
        
        loadingDiv.stopAnimation();
        setTimeout(function() {
            loadingDiv.hide();
        }, 500);
    }

    _createShipDeck () {
        let material = new THREE.LineBasicMaterial({color: 0x3d8ca8, opacity: 1, linewidth: 2 }),
            extraSep = this.appScene.options.extraSep,
            maxWidth = this.maxWidth,
            maxDepth = this.maxDepth,
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
        this.scene.add(line);

        this.simpleDeck = line;
    }

    _createHouse (hAbv) {
        var extraSep = this.appScene.options.extraSep,
            maxWidth = this.maxWidth,
            belowTiers = this.appScene.data.belowTiers,
            maxWidthFeet = maxWidth * (8 + extraSep) / 2 * 0.9,
            maxHeightFeet = Math.max(1, hAbv) * (9.5 + extraSep) + 6,
            geom, obj, mesh, rectGeom,
            hBel = Math.max(1, belowTiers.n * 0.7 ),
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
        this.scene.add(obj3d);
        
        this.shipHouse = { mesh: obj3d, dropdown: null, currPosBay: 0, currPosZ: 0 };
    }     

    setCameraPosition(x, y, z) {
        this.camera.position.z = z;
        this.camera.position.x = x;
        this.camera.position.y = y;
        this.controls.maxDistance = z * 2;
        this.controls.minDistance = z / 2;    
        return ({x, y, z});    
    }

    resize3DViewer (w, h) {
        if (!this.camera) { return; }
        this.width = w;
        this.height = h; 
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w , h);            
    }

    loadModel(mainScene, modelFilesDir, modelFilesMtl, modelFilesObj) {

        let that = this,
            node = this.container,
            loadDiv = node.loadingDiv,
            options = this.appScene.options,
            mats, mesh, rt, cm, loader, mtlLoader, objLoader, 
            
            onProgress = function (xhr) {
                let percentComplete = xhr.loaded / (xhr.total || 3000000);
                loadDiv.updateLoader(percentComplete, 0.3);
            },
            onLoaded = function(fileObj) {
                let ev = __d__.addEventDsptchr("modelLoaded");

                //Dispatch event
                ev.data = { model: fileObj };
                node.dispatchEvent(ev);

                //Finish the loading div
                loadDiv.updateLoader(1, 0.5);
                
                //Hide the loading div
                setTimeout(function() {
                    loadDiv.hide();
                }, 500);
                
            };

        return new Promise(
            function(resolve, reject) {
                let modelName = modelFilesObj.replace(".", "_");

                if (that._modelsLoaded[modelName]) {
                    resolve(modelName); return;
                }

                loadDiv = that.container.loadingDiv;
                loadDiv.setPercentage(0);
                loadDiv.setMessage("Loading model...");
                loadDiv.show();
                
                mtlLoader = new THREE.MTLLoader();
                mtlLoader.setBaseUrl(modelFilesDir + "textures/");
                mtlLoader.setPath(modelFilesDir);
                mtlLoader.load(modelFilesMtl, function(materials) {
                    let cm, loader;
                    
                    materials.preload();

                    objLoader = new THREE.OBJLoader();
                    objLoader.setPath(modelFilesDir);
                    objLoader.setMaterials(materials);
                    objLoader.load(modelFilesObj, function (object) {
                        let m, mesh = new THREE.Object3D(); 
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
                    }, 
                    onProgress, 
                    function (xhr) { 
                        window.alert('An error happened loading assets');
                        console.error(xhr);
                        reject();
                    });         
                });
            }
        );
  
    }

    animate() {
        var me = this;
        
        function anim() {
            requestAnimationFrame(anim);            
            me.controls.update();
            me.render();
        }
        anim();            
    }

    render() {
        let intersects, lenI, nameSel, selObj, mesh;
            
        if (!this._isRendering) { return; }

        this.frames += 1;

        if (this.frames & 1) {

            this.raycaster.setFromCamera(this.mouseVector.clone(), this.camera);
            intersects = this.raycaster.intersectObjects(this.scene.children, true);
            lenI = intersects.length;

            if (lenI > 1) {
                let containersIDs = this.appScene.data.containersIDs;
                nameSel = intersects[1].object.name;
                if ( nameSel !== null && nameSel !== undefined) {

                    selObj = containersIDs[nameSel];
                    if(selObj) {
                        if ( intersects[1].object !== this._INTERSECTED ) {
                            //Any highlighted? return to normal texture 
                            if ( this._INTERSECTED ) { 
                                this._INTERSECTED.material = this._INTERSECTED.isBasic ? 
                                    this.basicMaterial : this.allMaterials[this._INTERSECTED.materialPos];
                            }
                            //Highlight it
                            this._INTERSECTED = intersects[1].object;
                            if (!this._INTERSECTED.isBasic) { this._INTERSECTED.material = this.selectionMaterial; }

                            this.putInfoWindow(selObj);
                        }
                    }
                    
                } 
            }
            else {
                if ( this._INTERSECTED ) { 
                    this._INTERSECTED.material = this._INTERSECTED.isBasic ? 
                                    this.basicMaterial : this.allMaterials[this._INTERSECTED.materialPos];
                    this._INTERSECTED = null;
                } 
            }  

        }


        //this.lightsGroup.rotation.x = this.camera.rotation.x;
        //this.lightsGroup.rotation.y = this.camera.rotation.y;
        //this.lightsGroup.rotation.z = this.camera.rotation.z;

        this.renderer.render(this.scene, this.camera);
    }

    putInfoWindow (selObj) {
        this.appScene._infoNode.innerHTML = "<small>Position:</small> " + selObj.p + "<br />" +
                            "<small>ID:</small> " + selObj.c + "<br />" + 
                            "<small>ISO:</small> " + selObj.i + (selObj.r ? " / Reefer" : "") +
                            
                            " <small>Status:</small> " + (selObj.s ? "full" : "empty") + "<br />" +
                            "<small>Carrier:</small> " + selObj.o + "<br />" +
                            //"<small>hazardous:</small> " + (selObj.w ? "yes" : "no") + "<br />" +
                            //"<small>tank:</small> " + (selObj.t ? "yes" : "no") + "<br />" +
                            //"<small>OOG:</small> " + (selObj.x ? "yes" : "no") + "<br />" +
                            "<small>POD:</small> " + selObj.d + "<br />" +
                            "<small>POL:</small> " + (selObj.f || "") + 
                            " <small>Weight:</small> " + selObj.m + "MT";
                            
        this.appScene._bayNode.innerHTML = "<small>bay</small> " + selObj.iBay;
    } 

}