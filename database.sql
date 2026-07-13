CREATE TABLE bookings (

    id INT AUTO_INCREMENT PRIMARY KEY,

    booking_number VARCHAR(50) UNIQUE,

    customer_name VARCHAR(255),

    customer_email VARCHAR(255),

    customer_phone VARCHAR(50),

    pickup_location TEXT,

    destination TEXT,

    booking_date DATE,

    booking_time TIME,

    vehicle_type VARCHAR(100),

    status VARCHAR(50) DEFAULT 'CONFIRMED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);