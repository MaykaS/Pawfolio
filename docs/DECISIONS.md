# Decision Log

## 2026-04-21: Start With Dogs

Decision: The first version focuses on dogs.

Reason: Dogs provide a clear first product surface and make breed selection, walks, medications, vaccines, and vet tracking concrete.

## 2026-04-21: Start With One Pet

Decision: The first user experience supports one dog.

Reason: This keeps the first prototype focused. The data model should still leave room for multiple pets later.

## 2026-04-21: Cute Companion, Serious Organization

Decision: The app should look cute, animated, and approachable while supporting real care organization.

Reason: The emotional appeal matters, but the app must still be trusted for schedules, medications, vaccines, and health history.

## 2026-04-21: Build Mobile-Style Web Prototype First

Decision: Start with a clickable mobile-style web prototype before native Android.

Reason: The app needs product and design iteration before committing to native mobile complexity. A web prototype can later inform a React Native/Expo implementation.

## 2026-04-21: Plan For Expo/React Native Later

Decision: The likely mobile path is Expo/React Native.

Reason: Expo can support Android, iOS, push notifications, photo picker, and GPS permissions while keeping one shared mobile codebase.
