<?php

include 'config.php';

$success = "";
$error = "";

/* MODIFY BOOKING */
if(isset($_POST['modify_booking'])){

    $booking_number = $_POST['booking_number'];
    $customer_email = $_POST['customer_email'];
    $pickup_date = $_POST['pickup_date'];
    $pickup_time = $_POST['pickup_time'];

    $stmt = $pdo->prepare("
        UPDATE bookings
        SET pickup_date=?, pickup_time=?
        WHERE booking_number=? AND customer_email=?
    ");

    $stmt->execute([
        $pickup_date,
        $pickup_time,
        $booking_number,
        $customer_email
    ]);

    if($stmt->rowCount() > 0){

        $success = "Booking modified successfully.";

    } else {

        $error = "Booking not found.";

    }
}

/* CANCEL BOOKING */
if(isset($_POST['cancel_booking'])){

    $booking_number = $_POST['booking_number'];
    $customer_email = $_POST['customer_email'];

    $stmt = $pdo->prepare("
        DELETE FROM bookings
        WHERE booking_number=? AND customer_email=?
    ");

    $stmt->execute([
        $booking_number,
        $customer_email
    ]);

    if($stmt->rowCount() > 0){

        $success = "Booking cancelled successfully.";

    } else {

        $error = "Booking not found.";

    }
}

?>

<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Booking</title>

    <link rel="stylesheet" href="css/style.css">

</head>

<body>
    <a href="manage-booking.php"> Manage Booking</a>

<section class="manage-booking-section">

    <div class="container">

        <h1>Manage Your Booking</h1>

        <?php if($success): ?>
            <div class="success-message">
                <?php echo $success; ?>
            </div>
        <?php endif; ?>

        <?php if($error): ?>
            <div class="error-message">
                <?php echo $error; ?>
            </div>
        <?php endif; ?>

        <!-- FORMULAIRE -->

        <form method="POST" class="manage-booking-form">

            <input type="text"
                   name="booking_number"
                   placeholder="Booking Number"
                   required>

            <input type="email"
                   name="customer_email"
                   placeholder="Email Address"
                   required>

            <input type="date"
                   name="pickup_date"
                   required>

            <input type="time"
                   name="pickup_time"
                   required>

            <button type="submit"
                    name="modify_booking"
                    class="btn-primary">

                Modify Your Booking

            </button>

            <button type="submit"
                    name="cancel_booking"
                    class="btn-danger">

                Cancel Booking

            </button>

        </form>

    </div>

</section>

</body>
</html>