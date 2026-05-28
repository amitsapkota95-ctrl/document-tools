# App Icon Setup

## Primary: Icon Composer (Liquid Glass)

The app uses **`Appleicon.icon`** from Icon Composer (saved in Downloads, copied into the Xcode project).

- **Do not** put Icon Composer **Export PNG** files into `AppIcon.appiconset` — those previews include pre-rendered chrome and black corners, which causes double margins on the Home Screen.
- Target → **General** → **App Icon** = `Appleicon` (matches `ASSETCATALOG_COMPILER_APPICON_NAME` in the project).
- Edit the icon in Xcode by opening `Appleicon.icon`, or replace the bundle from a fresh **File → Save** in Icon Composer.

Export variants for marketing live in `ios/docs/icon-exports/` (copied from Downloads).

## Legacy fallback (iOS 17 back-deploy)

`Resources/Assets.xcassets/AppIcon.appiconset/icon.png` remains as a flat fallback generated from the artwork layer (`Generated_image_cropped.png` in the `.icon` bundle). Xcode uses the `.icon` file on iOS 26+ and falls back to the asset catalog on older releases.

## In-app branding

`BrandIcon.imageset` uses the same full-bleed artwork (green + leaf) for Home and More.

## Web favicons

`src/app/icon.png` (32×32) and `apple-icon.png` (180×180) are resized from the artwork layer.

## Icon not updating on device

1. Delete the app from the device  
2. **Product → Clean Build Folder** in Xcode  
3. Reinstall (bump `CURRENT_PROJECT_VERSION` if the icon still looks cached)
