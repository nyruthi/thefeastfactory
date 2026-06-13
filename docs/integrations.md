# External Integrations

The project is wired with environment variables for external services, but local development can start with placeholders.

## MSG91 OTP

Needed variables:

- `MSG91_AUTH_KEY`
- `MSG91_TEMPLATE_ID`
- `MSG91_SENDER_ID`
- `MSG91_OTP_EXPIRY_SECONDS`

Steps:

1. Create or log in to a MSG91 account.
2. Complete required sender ID and template approvals.
3. Create an OTP template for login verification.
4. Copy the auth key, template ID, and sender ID into `apps/api/.env`.
5. Keep OTP expiry aligned with `PlatformSetting.otp_expiry_seconds`.

## Razorpay

Needed variables:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAY_CURRENCY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

Steps:

1. Create or log in to a Razorpay merchant account.
2. Use test mode while developing.
3. Copy key ID and key secret from the Razorpay dashboard into `apps/api/.env`.
4. Add the key ID to both frontend `.env.local` files as `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
5. Create a webhook endpoint pointing to `/payments/razorpay/webhook`.
6. Subscribe to payment and refund events used by the API.
7. Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`.

## Resend

Needed variables:

- `RESEND_API_KEY`
- `EMAIL_FROM`

Steps:

1. Create or log in to a Resend account.
2. Verify the sending domain.
3. Create an API key.
4. Set `EMAIL_FROM` to a verified sender address.

## Google Cloud Storage

Needed variables:

- `GCP_PROJECT_ID`
- `GCP_STORAGE_BUCKET`
- `GOOGLE_APPLICATION_CREDENTIALS`

Steps:

1. Create a GCP project.
2. Create a Cloud Storage bucket for dish images and assets.
3. Create a service account with limited storage permissions.
4. Download the service account JSON for local development.
5. Set `GOOGLE_APPLICATION_CREDENTIALS` to the local JSON path.

## Sentry

Needed variables:

- `SENTRY_DSN`

Steps:

1. Create a Sentry project for the API and each frontend app.
2. Copy the DSN into the matching env file.
3. Keep DSN empty locally if error reporting is not needed yet.
