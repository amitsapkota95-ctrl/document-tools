# Launch Performance Notes

## Debug vs Release (local build comparison)

Measured on this machine with `xcodebuild` for `generic/platform=iOS` (incremental builds after prior compile):

| Configuration | Build time | App executable size |
|---------------|------------|---------------------|
| Debug         | ~12s       | Larger (unoptimized, debug symbols) |
| Release       | ~2s        | ~5.3 MB |

**What this means for first launch on device**

- **Xcode Debug** installs are slower on first cold start (2–5s blank screen is normal): LLDB attaches, frameworks link cold, SwiftUI builds the initial `TabView` tree.
- **Release / TestFlight** cold start is typically much faster because the binary is optimized and no debugger is attached.
- **Second and later launches** on the same install are usually under ~1s unless the app was terminated under memory pressure.

## How to test realistic user timing

1. Xcode → Product → Scheme → Edit Scheme → Run → set **Build Configuration** to **Release**
2. Delete the app from the device, then Run
3. Time from tap to Home tab visible

## Startup polish in this project

- `UIWindow.appearance().backgroundColor` matches `Color.paper` so the gap after the launch screen is not harsh system white.
- `TemporaryFileCleanup.purgeStaleExports()` runs on a background utility queue, not blocking first frame.
- `LaunchScreen.storyboard` shows brand icon + app name on a `PaperBackground` canvas.
