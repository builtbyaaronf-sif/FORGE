# Legal Gate Integration Guide
**Lightweight consent modal for static HTML sites. 5-minute setup.**

---

## What This Does

Adds a modal legal consent gate that:
- Shows once on first visit
- Stores consent in localStorage (no backend needed)
- Requires checkbox acceptance before continuing
- Persists across sessions
- Blocks navigation until accepted
- Fully styled to match FORGE brand

---

## Integration Steps

### 1. Add the Legal Gate Code to index.html

**Location:** Just before the closing `</body>` tag in index.html.

**Steps:**
1. Open `C:\Users\gravi\Claude\Projects\FORGE\index.html`
2. Find the closing `</body>` tag (line ~1098)
3. Copy all content from `LEGAL_GATE_LIGHTWEIGHT.html`
4. Paste it BEFORE the closing `</body>` tag
5. Save

**Result:** The CSS, modal HTML, and JavaScript will be embedded directly in index.html.

### 2. Update the Terms/Privacy Links (Optional)

The gate links to `/terms` and `/privacy`. If these don't exist yet:

**Option A: Create static pages**
```html
<!-- Create /public/terms.html and /public/privacy.html -->
<!-- They'll be served as-is by Vercel -->
```

**Option B: Update links in the modal**
```html
<!-- In the legal gate HTML, change: -->
<a href="/terms" onclick="event.preventDefault(); window.open('/terms', '_blank')">Terms of Service</a>

<!-- To point to your actual terms page, e.g.: -->
<a href="https://yoursite.com/legal/terms" onclick="event.preventDefault(); window.open('https://yoursite.com/legal/terms', '_blank')">Terms of Service</a>
```

### 3. Deploy to Vercel

```bash
cd C:\Users\gravi\Claude\Projects\FORGE
git add index.html
git commit -m "feat: add lightweight legal consent gate"
git push origin main
```

Vercel will auto-deploy. Check https://forgeisagentic.tech

### 4. Test

1. Open https://forgeisagentic.tech in **incognito/private mode**
2. Gate modal should appear
3. Try clicking "Accept" without checking box → Error message
4. Check box → Button enables
5. Click "Accept" → Modal closes, page loads
6. Refresh page → Gate does NOT appear (consent stored)
7. Open DevTools > Application > LocalStorage → Search for `forge_legal_consent`
8. Should see: `{"version":"1.0","timestamp":1234567890,"userAgent":"...","accepted":true}`

---

## Features

### Automatic Display
- Shows only on first visit
- Hidden on all subsequent visits
- Uses `localStorage` to track consent
- Survives browser restarts

### Consent Checkbox
- Checkbox required to enable accept button
- Error message if user tries to bypass
- Clear, accessible design

### Storage Structure
```json
{
  "version": "1.0",
  "timestamp": 1687234567890,
  "userAgent": "Mozilla/5.0...",
  "accepted": true
}
```

### Decline Handling
- If user clicks "Decline & Leave", they're redirected to homepage
- Decline is also recorded in localStorage
- You can check `LegalGate.getConsent()` to see if they declined

---

## Manual Control via JavaScript Console

After integration, you have access to:

```javascript
// Check if user has consented
LegalGate.hasConsented()
// Returns: true or false

// Get full consent record
LegalGate.getConsent()
// Returns: { version, timestamp, userAgent, accepted }

// Show gate again (e.g., to reset)
LegalGate.reset()
// Clears localStorage and shows gate

// Show/hide programmatically
LegalGate.show()
LegalGate.hide()
```

---

## Updating Terms (Versioning)

When you update your legal terms:

1. Update the version number in the JavaScript:
```javascript
const CONSENT_VERSION = '1.1'; // was '1.0'
```

2. This will trigger the gate to re-show for all users
3. They'll need to accept the new version
4. Old consent records are ignored

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- All modern mobile browsers
- localStorage support is required

---

## Security Notes

### What This Gate Does:
✅ Prevents page interactions until consent is given  
✅ Stores consent timestamp and user agent  
✅ Blocks ESC key and overlay clicks  
✅ Persists across sessions  

### What This Gate Does NOT Do:
❌ Does not validate consent on the server (for static sites)  
❌ Does not connect to a database  
❌ Does not integrate with payment systems  
❌ Is not GDPR-compliant on its own (you need proper Terms/Privacy)  

### If You Need More Security Later:
→ See `LEGAL_GATES_ARCHITECTURE.md` for production-grade system  
→ Includes server-side validation, database tracking, webhook integration  
→ Recommended when you launch paid services  

---

## Troubleshooting

### "Gate appears every time I visit"
- Check localStorage: DevTools > Application > LocalStorage
- If `forge_legal_consent` exists with proper data, gate should NOT show
- Try clearing localStorage and reloading
- Confirm JavaScript is enabled

### "Checkbox doesn't enable button"
- Check browser console for JS errors
- Verify CSS loaded (modal should be styled)
- Try different browser

### "Gate appears in production but not locally"
- localStorage might have different permissions locally
- Try opening in incognito mode
- Check DevTools console for errors

### "I want to re-show the gate to all users"
- Increment `CONSENT_VERSION` (e.g., '1.0' → '1.1')
- Deploy
- Gate will show again for all users
- Users must re-accept new version

---

## File Structure After Integration

```
index.html (now includes):
  ├── <style> → Legal gate CSS
  ├── <div id="legalGateOverlay"> → Modal HTML
  └── <script> → Legal gate logic + LegalGate API
```

**Size impact:** ~6KB additional HTML/CSS/JS (gzipped: ~1.5KB)

---

## Next Steps

1. **Immediate:** Add to index.html and deploy (5 min)
2. **Today:** Test in incognito mode, verify consent storage
3. **This week:** Create /terms and /privacy pages
4. **Future:** Upgrade to production system when handling payments (see LEGAL_GATES_ARCHITECTURE.md)

---

## Questions?

**"Can I customize the modal styling?"**  
Yes. Edit the CSS in the `<style>` section. Uses FORGE design tokens (--accent, --ink, --surface, etc.)

**"Can I change the consent message?"**  
Yes. Edit the text in the `<div class="legal-gate-modal">` section.

**"What if user has JavaScript disabled?"**  
Gate won't show. Page loads normally. Not ideal, but localStorage requires JS anyway.

**"Can I require consent to use specific features?"**  
Yes. Check `LegalGate.hasConsented()` before running code that needs consent.

**"Is this GDPR-compliant?"**  
The gate itself is compliant. Your Terms/Privacy pages must be too. Not a legal document.

---

**You're ready. Deploy today.**
