<!DOCTYPE html>
<html>
	<head>
		<meta charset=utf-8>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
		<title>BAPLIE Viewer Online - 3D Vessel</title>
		<link rel="stylesheet" href="system/css/styles.css" />
		<link rel="stylesheet" href="system/lib/css/colorpicker/colorjoe.css" />
	</head>
	<body>
        <!-- --------------------------
           Developed by www.saants.es
        --------------------------- -->
        <div id="app-3d"" class="app3d-main-panel"
            data-gpu="It seems that your graphic card does not support WebGL. Without it we cannot show you the 3D Vessel Content.<br />Try using another browser."
            data-webgl="Your browser does not support WebGL. Without it we cannot show you the 3D Vessel Content.<br />Only for modern browsers & IE11+">
        
            <div id="prevnext-container" class="prevnext-container">
                <span id="bay-prev" class="prevnext bay-prev noselect ">&larr; Previous bay</span>
                <span id="bay-next" class="prevnext bay-next active noselect ">Next bay &rarr;</span>
            </div>

            <div id="app-3d-loading-div" class="app3d-loading-div">
                <div id="app-3d-loading-div-text" class="app3d-loading-div-text"></div>
                <img src="system/images/logo.png" alt="loading" class="app3d-loading-logo-img" />
            </div>
        </div>
        <!-- <img id="img-loader-logo" class="hidden" src="system/images/logo.png" /> -->
        
        <h1 id="titleH1" class="titleH1"></h1>
        <h2 id="titleBay" class="titleBay"></h2>
        <span id="open-panel" class="open-close-panel noselect">
            See container data for this bay
        </span>        
        <div class="info-panel">
            <div id="info-window" class="info-window"></div>
            <div class="expand-view">
                <input id="expandView" type="checkbox" /> <label for="expandView" class="noselect">View Bay By Bay</label>
            </div>
            <div class="add-house">
                <h3>Add a Bridge:</h3>
                <select id="dropAddHouse"></select>
            </div>
            <div class="view-hcs">
                <input id="view-hcs" checked type="checkbox" /> <label for="view-hcs" class="noselect">Hatch-covers</label>
            </div>            
            <div class="onlybay">
                <h3>View a specific Bay:</h3>
                <select id="dropBays"></select>
            </div>   
            <div class="filtering">
                <h3>Filter containers by:</h3>
                <select id="dropFilter"></select>
                <select id="dropFilterValue" disabled><option value=''>No filter</option></select>
                <input id="showWireframesFiltered" checked type="checkbox" /> <label for="showWireframesFiltered" class="noselect">Show wireframes</label>
            </div>
            <div class="coloring">
                <h3>Color containers by:</h3>
                <select id="dropColors"></select>
                <ul id="tableColors"></ul>
                <button id="launchColorsWidget" class="launchColorsWidget">Customize colors</button>
            </div>
            <div class="generate-pdf">
                <button id="btnLaunchPDF" class="btnLaunchPDF">PRINT Full Cargo View</button>
            </div>
            <div class="instructions">
            Press [ESC] to return to the initial view.
            </div>            
        </div>
        <div id="bay-panel" class="bay-panel">
            <span id="close-panel" class="open-close-panel noselect">
                <br />&larr; back to 3D view
            </span>
            <iframe id="bay-iframe-container" class="iframe-container" width="100%"></iframe>
        </div>    
        
        <div id="tracer" class="tracer"> </div>
        <form id="posted-values" class="posted-values">
            <input type="hidden" name="json" id="json" />
            <input type="hidden" name="bay" id="bay" />            
        </form>

<?php include 'php/readColors.php'; ?>

        <script>
            var bayviewRoute = "../bayview.php";
            var generatePdfRoute = "php/generatePDF.php";
            var writeColorsRoute = "php/writeColors.php";
            var userSettings = { 
                    colors: <?php echo json_encode($responseColors) ?>
                };

        </script>
        
		<!--[if IE]>
    	<script src="system/lib/js/polyfills/browser-polyfill.min.js"></script>
		<script src="system/lib/js/polyfills/es6-promise.js"></script>
		<![endif]-->
        <script src="system/lib/js/colorpicker/min/one-color-min.js"></script>
        <script src="system/lib/js/colorpicker/min/colorjoe-min.js"></script>
        <script src="system/js/build/min/libraries-for-app3d-min.js"></script>
        <script src="system/lib/js/underscore/underscore-min.js"></script>
        <script src="system/lib/js/jquery/jquery-3.1.1.min.js"></script>
        <script src="system/lib/js/jquery/upload-progress.js"></script>        
        <script src="system/js/build/app3d.js"></script>

	</body>
</html>