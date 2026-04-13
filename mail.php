<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://alhasani.iq');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$name    = htmlspecialchars(strip_tags($_POST['name']    ?? ''));
$email   = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
$message = htmlspecialchars(strip_tags($_POST['message'] ?? ''));

if (!$name || !$email || !$message) {
    echo json_encode(['success' => false, 'error' => 'Missing fields']);
    exit;
}

/* ── SMTP config ── */
define('SMTP_HOST', 'securemail.aplus.net');
define('SMTP_USER', 'info@alhasani.iq');
define('SMTP_PASS', 'inf@cisco@123');   /* ⚠ move to config outside public_html when possible */
define('SMTP_PORT', 465);

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;  /* SSL → port 465 */
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom(SMTP_USER, 'Al-Hasna Group Website');
    $mail->addAddress(SMTP_USER, 'Al-Hasna Group');
    $mail->addReplyTo($email, $name);

    $mail->Subject = 'New Message — Al-Hasna Group Website';
    $mail->Body    = "Name: $name\nEmail: $email\n\nMessage:\n$message";

    $mail->send();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $mail->ErrorInfo]);
}
?>