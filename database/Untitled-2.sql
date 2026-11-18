USE cinema_booking;
SELECT DISTINCT role FROM User;
SELECT user_id, email, role, LEFT(password, 20) AS hash_start FROM User;