<?php
    header('Content-Type: application/json');
    
    /*
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);*/

    require('fpdf.php');

    set_time_limit(0);
    $const_location_url = "temp/";

    $title = $_POST["title"];
    $page_size = $_POST["pageSize"];
    $page_size_w = $_POST["pageSizeW"];
    $page_size_h = $_POST["pageSizeH"];
    $page_orientation = $_POST["pageOrientation"];
    $filterBy = $_POST["filterBy"];
    $num_images = intval($_POST["numImages"]);

    function saveImage($id, $name, $data, $loc) {
        
        //check there is an image
        if($data == "" or strpos($data, "data:image/") === false) { return; }
        
        //Separate type from image data
        list($type, $data) = explode(';', $data);
        list(, $data)      = explode(',', $data);
        $data = base64_decode($data);
        
        //Get image format (png or jpg)
        $image_format = str_replace('data:image/', '', $type);
        
        //Compose Image name       
        $image_name = $id . "_" . $name . "." . $image_format;
        
        //Save it to disk
        file_put_contents($loc . $image_name, $data);
        
        //returns the name of the image, if needed...
        return $loc . $image_name;
    }

    function generateRandomString($length = 10) {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }

    class PDF extends FPDF
    {
        // Cabecera de página
        function Header()
        {
            $this->SetY(0);
            $this->SetFont('Arial','B',15);
            $this->Cell(0,0.5, $GLOBALS['title'], 0, 0, 'C');
        }

        // Pie de página
        function Footer()
        {
            $ww = ($GLOBALS['page_size_w'] - 1) / 3;
            $this->SetY(-0.5);
            $this->SetFont('Arial','',7);
            $this->Cell($ww,0.5,$GLOBALS['filterBy'], 0, 0, 'L');
            $this->SetFont('Arial','I',7);
            $this->Cell($ww,0.5,'Page '.$this->PageNo().'/{nb}', 0, 0, 'C');
            $this->SetFont('Arial','',7);
            $this->Cell($ww,0.5,date('jS \of F Y h:i:s A'), 0, 0, 'R');
        }
    }    

    $temp_id = generateRandomString(16);

    //Save images
    for ($i = 0; $i < $num_images; $i++) {
        $images["page_" . $i] = saveImage( $temp_id, "page_" . $i, $_POST["page_" . $i], $const_location_url);
    }

    //Generate PDF
    $pdf = new PDF($page_orientation, "in", $page_size);
    $pdf->AliasNbPages();
    for ($i = 0; $i < $num_images; $i++) {
        $pdf->AddPage();
        $pdf->Image($images["page_" . $i], 0, 0.5, $page_size_w, $page_size_h);
    }
    $pdf->Output("F", $const_location_url . $temp_id . ".pdf");

    //House-keeping
    for ($i = 0; $i < $num_images; $i++) {
        unlink($images["page_" . $i]);
    }

    //return JSON array
    $value = array(
        "numPages" => $num_images, 
        "pdfName" => $temp_id,
        "download" => "php/" . $const_location_url . $temp_id . ".pdf"
    );
    echo json_encode($value);    
?>