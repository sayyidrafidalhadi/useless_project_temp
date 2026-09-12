# Banana Peeler 🍌

A very useless Expo app for Android and iPhone. Swipe down 1,000 times to peel a banana. Find another banana inside. Repeat for no reason.

## Run on your phone

```sh
npm install
npm start
```

Open the QR code with a compatible **Expo Go** build on your phone. Keep your phone and computer on the same Wi-Fi. This project uses **Expo SDK 57**; get its compatible client from [expo.dev/go](https://expo.dev/go). For networks that block local device connections, try `npx expo start --tunnel` (Expo may offer to install its tunnel helper).

For a browser preview, run `npm run web`. Run `npm run android` for an installed Android emulator; `npm run ios` requires macOS and an iOS simulator.

## Hackathon demo

1. Open settings using the sliders button in the top right.
2. Enable **Hackathon demo**. This banana takes 20 swipes.
3. Swipe downward on the illustration, or tap **Peel once**.
4. At 100%, find a smaller banana in the peel. Tap **Peel another banana**.

Demo and classic modes preserve their progress independently. Lifetime stats include both. Progress and preferences are saved locally with AsyncStorage; there is no account or backend. The timer counts foreground app time, including time in settings.

The app includes an original SVG banana that peels as you progress, haptic feedback on supported devices, milestone messages, reduced-motion support, and a button alternative to swiping. Upward swipes, sideways drags, and very short movements do not count.

## Check and export

Use Node.js 22.18 or newer for the tests' native TypeScript support.

```sh
npm run typecheck
npm test
npm run export
```

The export bundles the application for Android, iOS, and web. It is not an APK or an App Store build. Native installation packages can be made later with Expo's build tools and your own signing setup.

## Files

- `App.tsx`: main screen, swipe interaction, settings, and animations.
- `src/components/Banana.tsx`: original vector artwork and progressive peel.
- `src/game.ts`: game rules, mode switching, and save validation.
- `src/useGame.ts`: serialized local saves and foreground timer.
- `tests/game.test.mjs`: game rules and corrupt-save tests.

No goals. No growth. Just banana.
