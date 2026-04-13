# Al-Hasna Group — Production Deployment Checklist
# ══════════════════════════════════════════════════

## 1. BEFORE UPLOAD
- [ ] Replace YOUR_EMAIL@DOMAIN.COM in script.js with your real email
- [ ] Register that email at https://formsubmit.co (one-time confirmation)
- [ ] Remove any .git folder before uploading to server
- [ ] Remove package.json / node_modules if present
- [ ] Remove any .env files
- [ ] Confirm all image files are present:
      alhasna-logo.png, homecenter.png, inhouse.png,
      veranda.png, clidor.png, Mrfawzi.png, hero-logo.png

## 2. SERVER SETUP (Nginx)
- [ ] Copy nginx.conf to /etc/nginx/sites-available/alhasna
- [ ] Run: sudo ln -s /etc/nginx/sites-available/alhasna /etc/nginx/sites-enabled/
- [ ] Install SSL: sudo certbot --nginx -d your-domain.com -d www.your-domain.com
- [ ] Run: sudo nginx -t   (must show "syntax is ok")
- [ ] Run: sudo systemctl reload nginx

## 3. SERVER SETUP (Apache alternative)
- [ ] Upload .htaccess to web root
- [ ] Ensure mod_headers, mod_rewrite, mod_deflate, mod_expires are enabled
- [ ] Run: sudo a2enmod headers rewrite deflate expires && sudo systemctl restart apache2

## 4. VERIFY SECURITY HEADERS
- [ ] Run: curl -I https://your-domain.com
      Expected headers present:
        Strict-Transport-Security
        X-Frame-Options: SAMEORIGIN
        X-Content-Type-Options: nosniff
        Content-Security-Policy
        Referrer-Policy
- [ ] Check at: https://securityheaders.com (target: A or A+)
- [ ] Check SSL at: https://www.ssllabs.com/ssltest/ (target: A+)

## 5. VERIFY BLOCKED PATHS
- [ ] https://your-domain.com/.git           → must return 404
- [ ] https://your-domain.com/.env           → must return 404
- [ ] https://your-domain.com/config.json    → must return 404
- [ ] http://your-domain.com                 → must redirect to https://

## 6. TEST CONTACT FORM
- [ ] Submit form with valid data → receives email
- [ ] Submit form with honeypot filled → silently blocked
- [ ] Submit form with empty fields → shows validation errors
- [ ] Submit form with invalid email → shows error
- [ ] Submit form with message < 10 chars → shows error

## 7. VERIFY BRAND OVERLAY
- [ ] Click each brand card → opens correct overlay
- [ ] Instagram button → opens correct URL in new tab
- [ ] Escape key / backdrop click → closes overlay
- [ ] Manually set data-brand="evil" in devtools → blocked by whitelist

## 8. FINAL CHECKLIST
- [ ] No console errors in browser
- [ ] No mixed content warnings (http + https)
- [ ] Google Fonts load correctly
- [ ] All images load
- [ ] Mobile layout works correctly
- [ ] Page speed acceptable (test at pagespeed.web.dev)

## SECURITY FIXES APPLIED (summary)
  ✓ Removed all window.* global function pollution
  ✓ Removed all inline onclick="" handlers from HTML
  ✓ Replaced all innerHTML string concatenation with safe DOM methods
  ✓ Added BRAND_WHITELIST — only 4 valid keys accepted
  ✓ Added sanitize() function for user input
  ✓ Replaced fake setTimeout form with real fetch() to FormSubmit
  ✓ Added honeypot anti-spam field
  ✓ Added maxlength on all inputs
  ✓ Added label[for] and role="alert" on errors (accessibility + security)
  ✓ Added defer to <script> tag
  ✓ Added security meta tags to <head>
  ✓ Added preconnect for Google Fonts + referrerpolicy="no-referrer"
  ✓ Instagram button uses addEventListener (not onclick property)
  ✓ Nginx config: HTTPS, HSTS, CSP, all security headers, blocks .git/.env
  ✓ Apache .htaccess: same headers, same file blocking
  ✓ TLS 1.2/1.3 only, strong cipher suites
  ✓ Gzip compression + static asset caching
  ✓ Server signature hidden

## VERDICT: SAFE TO DEPLOY ✓
  One required action: replace YOUR_EMAIL@DOMAIN.COM in script.js
