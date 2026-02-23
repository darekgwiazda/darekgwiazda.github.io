<?php
// Simple PHP mail handler for contact form
$to = 'mielek@interia.pl';
$subject = 'Wiadomość z formularza kontaktowego';

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

$headers = "From: $name <$email>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$body = "Imię i nazwisko: $name\n";
$body .= "Email: $email\n";
$body .= "Wiadomość:\n$message\n";

// Basic validation
if ($name && $email && $message && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    if (mail($to, $subject, $body, $headers)) {
        echo '<p class="success">Dziękujemy za wiadomość! Skontaktujemy się wkrótce.</p>';
    } else {
        echo '<p class="error">Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie później.</p>';
    }
} else {
    echo '<p class="error">Wypełnij poprawnie wszystkie pola formularza.</p>';
}
?>