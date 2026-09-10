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

> The app is on **Trial access**. Pins created by a Trial app are sandbox
> entities, visible only to their creator. Publishing through the API today
> would produce pins nobody else can see.

So the API path is written, tested, and waiting for Standard access.

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
