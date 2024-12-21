<<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $to = 'roodra248@gmail.com'; // Replace with your email address
    $from_name = htmlspecialchars($_POST['name']);
    $from_email = htmlspecialchars($_POST['email']);
    $subject = htmlspecialchars($_POST['subject']);
    $message = htmlspecialchars($_POST['message']);
    
    $headers = "From: $from_name <$from_email>\r\n";
    $headers .= "Reply-To: $from_email\r\n";

    if (mail($to, $subject, $message, $headers)) {
        echo "Message sent successfully!";
    } else {
        echo "Failed to send message. Please try again.";
    }
} else {
    echo "Invalid request method.";
}
?>

