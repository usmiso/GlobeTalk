# GlobeTalk Profile Schema

This document describes the current shape of the `profiles/{userID}` documents stored in Firestore as used by the server API.

Required fields (created via POST /api/profile):
- userID: string
- intro: string
- ageRange: string (e.g., "18-24")
- hobbies: string[]
- timezone: string (region or timezone label)
- language: string | string[] (server accepts either)
- country: string (derived from timezone selection)

Optional fields (accepted and merged if present):
- favorites: string
- facts: string
- sayings: string | string[]
- username: string
- avatarUrl: string (URL)
- countryCode: string (ISO alpha-2)
- languageCode: string (e.g., ISO 639-1)
- chats: string[] (match chat IDs)
- MatchedUsers: string[] (UIDs)

Derived collections for filtering UI:
- available_languages/{name}
  - name: string
  Notes: server adds entry for each language when saving profiles. If `language` is an array, each entry is added.

- available_countries/{name}
  - name: string
  Notes: server adds entry for each timezone/country name when saving profiles (used by matchmaking filters).

Compatibility notes:
- The legacy profile page (`/pages/profile`) posts `languageCode` and `language` (human-readable). The server stores both if provided and still supports `language` as string or array for matchmaking.
- The richer user profile page (`/pages/userprofile`) can send `language` as an array, plus favorites/facts/sayings.

Matchmaking expectations:
- GET /api/matchmaking filters by exact `timezone` string and/or `language` value. If `language` is an array in a profile, any match within the array will satisfy the filter.

Validation recommendations:
- Ensure at least one hobby; non-empty intro; selected ageRange; valid timezone; and at least one language.
- Language values should be normalized consistently across clients for better matching (consider ISO codes and display names on the client).
