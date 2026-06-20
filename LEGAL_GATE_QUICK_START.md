# Legal Gate Quick Start
**Deploy in 5 minutes. Copy, paste, ship.**

---

## The Plan (5 steps, 5 minutes)

### Step 1: Open Your Files (1 min)
```
Open TWO files side by side:
1. C:\Users\gravi\Claude\Projects\FORGE\index.html
2. C:\Users\gravi\Claude\Projects\FORGE\LEGAL_GATE_LIGHTWEIGHT.html
```

### Step 2: Copy the Legal Gate Code (30 sec)
In `LEGAL_GATE_LIGHTWEIGHT.html`:
- [ ] Select ALL content (Ctrl+A)
- [ ] Copy (Ctrl+C)

### Step 3: Find the Right Place in index.html (1 min)
In `index.html`:
- [ ] Use Ctrl+End to jump to the end of the file
- [ ] Find `</body>` tag (should be at the very end, around line 1098)
- [ ] Click just BEFORE `</body>`
- [ ] Position cursor on a new line

### Step 4: Paste the Gate (30 sec)
- [ ] Paste (Ctrl+V)
- [ ] Press Enter a couple times to separate it from `</body>`

### Step 5: Deploy (2 min)
Open terminal and run:
```bash
cd C:\Users\gravi\Claude\Projects\FORGE
git add index.html
git commit -m "feat: add lightweight legal consent gate"
git push origin main
```

---

## Verification (2 min)

After deployment, verify it works:

1. **Wait 30 seconds** for Vercel to deploy
2. **Open:** https://forgeisagentic.tech in **incognito/private window**
3. **You should see:** A dark modal with "Legal Terms & Conditions"
4. **Try clicking "Accept & Continue"** without checking the box → Error message appears
5. **Check the box** → Button turns blue and enables
6. **Click "Accept & Continue"** → Modal closes, site loads
7. **Refresh the page** → Modal does NOT appear (consent stored)

✅ If all steps work, you're done.

---

## What Just Happened

You embedded:
- 150 lines of CSS (modal styling)
- 40 lines of HTML (modal markup)
- 80 lines of JavaScript (consent logic)
- ~7KB uncompressed (~1.5KB gzipped)

Users will see:
1. Gate on first visit
2. Must check "I agree" box
3. Click to continue
4. Consent saved to browser
5. Gate never shows again (unless terms change)

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| index.html | Modified | Added legal gate code |
| LEGAL_GATE_LIGHTWEIGHT.html | New | Gate code (reference) |
| LEGAL_GATE_INTEGRATION_GUIDE.md | New | Detailed integration guide |
| LEGAL_GATES_ARCHITECTURE.md | Existing | Production-grade system (for later) |
| LEGAL_GATES_IMPLEMENTATION_CHECKLIST.md | Existing | Production checklist (for later) |
| LEGAL_GATES_ROADMAP.md | New | Lightweight → Production roadmap |

---

## Your Consent Storage

After users accept, localStorage stores:
```json
{
  "forge_legal_consent": {
    "version": "1.0",
    "timestamp": 1687234567890,
    "userAgent": "Mozilla/5.0...",
    "accepted": true
  }
}
```

Users can see this in DevTools:
- F12 → Application → LocalStorage → forgeisagentic.tech

---

## If Something Goes Wrong

### "Gate doesn't appear on fresh visit"
- Clear browser cache and localStorage
- Open in incognito mode
- Check browser console for JS errors (F12)

### "Button doesn't enable when I check box"
- Refresh page
- Try different browser
- Check console for errors

### "Gate appears but it's unstyled"
- CSS might not have loaded
- Refresh (Ctrl+Shift+R for hard refresh)
- Check that all code was pasted

### "I pasted the code but Vercel didn't update"
- Wait 60 seconds for auto-deployment
- Check Vercel dashboard: https://vercel.com/dashboard
- Manually trigger deploy if needed

---

## Rollback (If Needed)

If something breaks:
```bash
git revert HEAD
git push origin main
```

This undoes the legal gate addition. Vercel will re-deploy clean version.

---

## Control Panel (Advanced)

After deployment, you can control the gate via browser console:

```javascript
// Check if user has consented
LegalGate.hasConsented()

// Get their full consent record
LegalGate.getConsent()

// Manually reset (show gate again for testing)
LegalGate.reset()

// Show/hide gate
LegalGate.show()
LegalGate.hide()
```

---

## Next: Create /terms and /privacy Pages (Optional)

The gate links to `/terms` and `/privacy`. Right now they probably don't exist.

**Option A: Do nothing**
- Links open in blank pages (fine for MVP)
- User sees 404 (expected)
- Gate still works

**Option B: Create simple pages (10 min)**
```html
<!-- Create: C:\Users\gravi\Claude\Projects\FORGE\public\terms.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Terms of Service</title>
  <meta charset="UTF-8">
</head>
<body>
  <h1>Terms of Service</h1>
  <p>By using FORGE, you agree that:</p>
  <ul>
    <li>You are using this service lawfully</li>
    <li>You understand the limitations of AI-generated content</li>
    <li>You take responsibility for content deployed under your name</li>
  </ul>
</body>
</html>

<!-- Create: C:\Users\gravi\Claude\Projects\FORGE\public\privacy.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Privacy Policy</title>
  <meta charset="UTF-8">
</head>
<body>
  <h1>Privacy Policy</h1>
  <p>We collect:</p>
  <ul>
    <li>Email (for contact only)</li>
    <li>Consent timestamp (for legal records)</li>
    <li>Browser user agent (for analytics)</li>
  </ul>
  <p>We do not sell your data.</p>
</body>
</html>
```

Then deploy like before:
```bash
git add public/terms.html public/privacy.html
git commit -m "docs: add terms and privacy pages"
git push origin main
```

---

## Timeline

**Right now:** Deploy lightweight gate (5 min)  
**This week:** Test with friends, verify consent storage  
**Next month:** When you land first paying client, read `LEGAL_GATES_IMPLEMENTATION_CHECKLIST.md` to upgrade to production system  

---

## What This Achieves

✅ Users must accept terms before using site  
✅ Consent is recorded with timestamp  
✅ Gate persists across sessions  
✅ No backend infrastructure needed  
✅ Works on static HTML sites  
✅ Styled to match FORGE brand  
✅ Mobile responsive  

---

## You're Ready

Everything you need is in this folder:
- `LEGAL_GATE_LIGHTWEIGHT.html` ← Code to copy
- `LEGAL_GATE_INTEGRATION_GUIDE.md` ← Detailed how-to
- `LEGAL_GATES_ROADMAP.md` ← Future upgrade path
- `LEGAL_GATES_ARCHITECTURE.md` ← Production system (later)
- `LEGAL_GATES_IMPLEMENTATION_CHECKLIST.md` ← Production checklist (later)

**Copy the code. Deploy. Done.**

---

**Go deploy. You've got 5 minutes.**
