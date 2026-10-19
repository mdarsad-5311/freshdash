# FreshDash Mobile App

A modern quick-commerce mobile application for farm-fresh grocery and produce delivery, built using **React Native**, **Expo Router**, and **TypeScript**.

---

## Overview

FreshDash is designed around the 10–15 minute hyperlocal grocery delivery workflow. It delivers a fast, tactile shopping experience featuring catalog exploration, real-time basket calculations, coupon codes, and address switching.

## Features

- **Storefront & Shelves**: Curated shelves for seasonal produce, daily vegetables, fresh fruits, and bestsellers.
- **Product Sprite Atlas**: Custom 4x3 sprite sheet renderer delivering high-performance produce imagery without network asset latency.
- **Dynamic Cart & Checkout Flow**: Real-time delivery fee threshold calculation (free above ₹199), promotional coupon support (`FRESH20`), and animated checkout preview.
- **Location Selector**: Seamless switching between saved delivery addresses (e.g. Home, Work).
- **Haptic Feedback**: Context-aware haptics using `expo-haptics` for selections, steppers, and completion actions.
- **Accessibility & Safe Areas**: Native safe area insets handling, high contrast text tokens, and accessibility labels across interactive controls.

## Tech Stack

- **Framework**: [Expo SDK 57](https://expo.dev) with [Expo Router v57](https://docs.expo.dev/router/introduction/)
- **Core**: React Native 0.86, React 19
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Typography**: `@expo-google-fonts/inter`
- **Icons**: `lucide-react-native`
- **Type Checking**: TypeScript

---

## Project Structure

```text
freshdash/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Bottom navigation tabs layout
│   │   ├── index.tsx           # Home screen with shelves & banners
│   │   ├── categories.tsx      # Produce category browser
│   │   ├── cart.tsx            # Basket, bill summary & promo code
│   │   └── profile.tsx         # User profile and account navigation
│   ├── listing.tsx             # Category listings with search, filter & sort
│   ├── product/[id].tsx        # Product details, weight selection & recommendations
│   ├── profile-section.tsx     # Order history, addresses, coupons & settings
│   └── _layout.tsx             # Root layout with font hydration
├── assets/
│   └── images/                 # Produce atlas & hero artwork
├── components/                 # Reusable UI primitives (Buttons, Cards, SearchBar, Txt)
├── constants/
│   ├── products.ts             # Product inventory data, categories & domain selectors
│   └── theme.ts                # Brand palette & typography tokens
├── store/
│   └── useShop.ts              # Zustand store for cart, favourites & address
└── utils/
    └── haptics.ts              # Platform-safe haptic triggers
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- [Expo Go](https://expo.dev/go) app on your mobile device, or an iOS / Android simulator

### Installation

1. Clone or open the repository:
   ```bash
   git clone <repo-url> freshdash
   cd freshdash
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

4. Run on a device or simulator:
   - **Android Device**: Scan the QR code shown in the terminal via Expo Go.
   - **Android Emulator**: Press `a` in the terminal.
   - **iOS Simulator**: Press `i` in the terminal.
   - **Web Preview**: Press `w` in the terminal.

### Verification Commands

```bash
# Type checking
npx tsc --noEmit

# Linting
npx expo lint
```

---

## License

MIT
