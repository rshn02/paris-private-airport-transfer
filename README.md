# Email Signature Setup

Files created:

- `signature.html`
- `preview.html`
- `assets/email/logo.png`
- `assets/email/phone.png`
- `assets/email/email.png`
- `assets/email/web.png`
- `assets/email/whatsapp.png`
- `assets/email/instagram.png`

## 1. Upload the image files to your website

Put these files on your domain at:

- `https://www.parisprivateairporttransfer.com/assets/email/logo.png`
- `https://www.parisprivateairporttransfer.com/assets/email/phone.png`
- `https://www.parisprivateairporttransfer.com/assets/email/email.png`
- `https://www.parisprivateairporttransfer.com/assets/email/web.png`
- `https://www.parisprivateairporttransfer.com/assets/email/whatsapp.png`

The final `signature.html` already uses those exact URLs.

If your hosting path is different, replace the URLs inside `signature.html` before using it in Gmail.

## 2. Check the preview locally

Open:

- `/Users/roshanmanoranjith/Desktop/paris-private-airport-transfer/preview.html`

This preview uses the local files in `assets/email/` so you can validate the layout before publishing the images.

## 3. Install the signature in Gmail on macOS / Chrome

1. Publish the files in `assets/email/` to your website first.
2. Open `/Users/roshanmanoranjith/Desktop/paris-private-airport-transfer/signature.html` in Chrome.
3. Select only the signature block.
4. Copy it with `Cmd + C`.
5. Open Gmail.
6. Click the gear icon, then `See all settings`.
7. In `General`, find the `Signature` section.
8. Create a new signature.
9. Click inside the signature box and paste with `Cmd + V`.
10. Save changes at the bottom of Gmail settings.

## 4. Important check after pasting

Send a test email to yourself and verify:

- the logo displays correctly
- the gold icons display correctly
- the phone link works
- the email link works
- the website link works
- the WhatsApp link works
- the signature stays readable on desktop and mobile

## 5. If Gmail strips or changes something

Use these rules:

- always paste from `signature.html`, not from `preview.html`
- publish the image files before pasting into Gmail
- avoid editing the signature heavily inside Gmail after paste
- if Gmail rewrites spacing, paste again into a fresh signature block

## 6. Notes

- The signature is built with tables and inline styles for email-client compatibility.
- The logo is not recreated and uses your existing PNG.
- The logo sits on white so it remains legible in light and dark email environments.
