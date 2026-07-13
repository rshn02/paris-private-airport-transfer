<?php

header('Content-Type: application/json');

require 'config.php';

$booking_number = $_POST['booking_number'];
$customer_email = $_POST['customer_email'];

$stmt = $pdo->prepare(
"SELECT * FROM bookings WHERE booking_number = ? AND customer_email = ?"
);

$stmt->execute([$booking_number, $customer_email]);

$booking = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$booking) {

    echo json_encode([
        'success' => false,
        'message' => 'Booking not found.'
    ]);

    exit;
}

$update = $pdo->prepare(
"UPDATE bookings SET status = 'CANCELLED' WHERE booking_number = ?"
);

$update->execute([$booking_number]);

require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;

$mail = new PHPMailer(true);

$mail->isSMTP();
$mail->Host = 'smtp.hostinger.com';
$mail->SMTPAuth = true;
$mail->Username = 'contact@parisprivateairporttransfer.com';
$mail->Password = 'YOUR_PASSWORD';
$mail->SMTPSecure = 'tls';
$mail->Port = 587;

$mail->setFrom('contact@parisprivateairporttransfer.com', 'Paris Private Airport Transfer');

$mail->addAddress($customer_email);

$mail->Subject = 'Reservation Cancelled';

$mail->Body = "Your reservation {$booking_number} has been cancelled successfully.";

$mail->send();

$mailAdmin = new PHPMailer(true);

$mailAdmin->isSMTP();
$mailAdmin->Host = 'smtp.hostinger.com';
$mailAdmin->SMTPAuth = true;
$mailAdmin->Username = 'contact@parisprivateairporttransfer.com';
$mailAdmin->Password = 'YOUR_PASSWORD';
$mailAdmin->SMTPSecure = 'tls';
$mailAdmin->Port = 587;

$mailAdmin->setFrom('contact@parisprivateairporttransfer.com', 'Paris Private Airport Transfer');

$mailAdmin->addAddress('parisprivateairporttransfer@gmail.com');

$mailAdmin->Subject = 'Booking Cancelled';

$mailAdmin->Body = "Booking {$booking_number} was cancelled by customer.";

$mailAdmin->send();


echo json_encode([
    'success' => true,
    'message' => 'Your reservation has been cancelled successfully.'
]);