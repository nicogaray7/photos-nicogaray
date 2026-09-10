# Pinterest: the RSS feed and the API path

Two ways to get a photo onto Pinterest exist in this project. Only one of them
publishes today, and running both against the same board pins every photo
twice. Read this before touching either.

## What publishes today: the RSS feed

`/rss.xml` (226 photos, serving the vertical `pinKey` image built by
`scripts/generate-pins.ts`) is auto-published by Pinterest to the **Travel
Photography** board of the **garaynicong** account. `/pinterest-feed.xml`
redirects to it with a 308. This is the production path. Never create a second
feed.

## What is ready but idle: the API path

`pin.mjs` creates pins through the official API v5. It exists because the feed
gives no control over which board a photo lands on, no title or link per pin,
and no failure report. It is not the production path yet, for one reason:

> The app is on **Trial access**, and a Trial app cannot create a pin in
> production at all. Pinterest answers `403 code 29`: "Apps with Trial access
> may not create Pins in production, use API Sandbox instead."

So `--publish` against production is a no-op until Standard access is granted.
`--sandbox` points the same code at `api-sandbox.pinterest.com`, which is how
the chain is exercised in the meantime.

### Getting Standard access

The upgrade form (My apps, Upgrade access) asks for two things this project does
not have yet:

1. A **video demo** showing the OAuth screen and the app creating a pin.
2. A **privacy policy URL**. The site has `/legal/mentions`, `/legal/cgv` and
   `/legal/license`, but no privacy page.

### Running it

```sh
/home/claudebot/pin-publier.sh --limit 3               # preview, no API call
/home/claudebot/pin-publier.sh --limit 1 --publish     # one real pin
```

The launcher refreshes the token, then runs `pin.mjs` inside
`nico-garay-app-1`. Nothing is published without `--publish`. Before creating
anything, the script reads the board's existing pins and skips any photo whose
gallery link is already pinned there, which is the guard against the double
publication the feed makes easy.

### Scopes

`user_accounts:read`, `boards:read`, `boards:read_secret`, `boards:write`,
`boards:write_secret`, `pins:read`, `pins:read_secret`, `pins:write`,
`pins:write_secret`. `boards:write` is not optional: Pinterest counts creating a
pin as writing to the board that holds it and refuses `POST /pins` without it.
The `_secret` variants allow preparing pins on a private board (`API test`)
before anything reaches the public profile.

### Where the credentials live

`/home/claudebot/agent-sdk-bot/secrets/pinterest.env`, mode 600, written by
`src/pinterest.ts` in the bot repository. The access token lives 30 days and
the refresh token 60, renewed on every use, so the pair stays valid as long as
the bot keeps checking it. `src/comptes.ts` declares the expected account
(`garaynicong`) and its probe both verifies the identity and performs the
refresh, so `npm run sante` is what keeps this credential alive.

If the refresh token ever dies, the whole dance is two commands from
`/home/claudebot/agent-sdk-bot`:

```sh
npm run pinterest url          # open the URL in a browser signed in as garaynicong
npm run pinterest code <CODE>  # the ?code= value from the address bar
```

### Rate limits

Trial: 1000 API calls per day per app, 300 writes per day. Standard: 100 calls
per second per user. `pin.mjs` refuses more than 25 pins in one run whatever
the tier allows, because a profile that dumps a hundred pins at once reads as
spam to Pinterest's own ranking.

## Switching from the feed to the API

The day the app gets Standard access:

1. Turn off the RSS auto-publish in the Pinterest account settings **first**.
2. Check the board no longer receives feed pins.
3. Then run `pin-publier.sh --publish`.

In that order. The other order pins everything twice.
