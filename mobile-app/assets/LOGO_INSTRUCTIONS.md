# Logo Asset

Place the brand logo as `assets/logo.png` to make it appear in the app.

## Where it shows
- Home top-left brand mark (32×32)
- Onboarding welcome hero (96×96)
- Settings → About card (60×60)
- Splash screen (also requires `assets/splash.png` to be the logo)
- App icon (`assets/icon.png`, `assets/adaptive-icon.png`, `assets/favicon.png`)

## Recommended file specs
- **Format:** PNG with transparent background (RGBA)
- **Resolution:** 1024×1024 minimum (will be scaled down per usage)
- **Padding:** ~10% inner padding so the mark isn't cropped at small sizes
- **Color:** Use the brand colors `#3e003f` (deep purple) + `#f05423` (orange)

## Without `logo.png`
If `assets/logo.png` is missing, the `Logo` component falls back to a brand-tinted "sparkles" icon. The app still works — it just shows a placeholder.

## To regenerate platform icons after saving the logo
```bash
cd mobile-app/assets
python generate_icons.py
```
That script creates `icon.png`, `adaptive-icon.png`, `splash.png`, `favicon.png` from a source.
