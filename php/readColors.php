<?php

function readColors() {
	$response;
	require_once("../../local_config.php");
	require_once(APP_INC_PATH."bootstrap_frontend.php");
	sessionsClass::site_protection(true,true,true,false,false);

	$userid = dbase::globalMagic($_SESSION['userid']);

	$data = Admin::get_user($userid,false,'profile',true);
	if ($data !== false){
		$username = dbase::globalMagic($data['username']);
	}

	//Query DB for username
	$sql_results ="SELECT attribute_key, attribute_value, hex_color FROM userbase.viewer_user_colors WHERE username = '".$username."';";

	//ALTER TABLE foobar_data MODIFY COLUMN col VARCHAR(255) NOT NULL DEFAULT '{}';
	$datagroup = dbase::globalQueryPlus($sql_results,$conn,2);

	if($datagroup[1]>0){
		$looped = dbase::loop_to_array($datagroup[0]);
		
		foreach($looped as $key=>$value){
			$response[$looped[$key]['attribute_key'].".".$looped[$key]['attribute_value']] = $looped[$key]['hex_color'];
		}
	}
	return $response;
}

$responseColors = readColors();

?>