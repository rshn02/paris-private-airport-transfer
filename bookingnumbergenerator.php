<?php

function generateBookingNumber() {

    return 'BK-' . date('Y') . '-' . rand(10000,99999);

}

?>