CREATE UNIQUE INDEX uniq_payments_booking_success
    ON payments (booking_id)
    WHERE status = 'SUCCESS';