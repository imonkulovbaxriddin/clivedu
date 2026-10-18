# ClivEdu

A personal English classroom: grammar and vocabulary lessons with your own slides, a Word Galaxy that grows as students learn, games, a host mode for class competitions, homework with notifications, and student profiles.

## How it is built

- `public/` is the website (plain HTML, CSS and JavaScript, no build step).
- `netlify/functions/api.mjs` and `netlify/lib/core.mjs` are the server: accounts, Google sign-in, lessons, slide files, access rules, homework. Data is stored in Netlify Blobs, so there is nothing to set up.
- Students' learning progress (stars, XP, favourites, saved words) is stored in each student's own browser. They can back it up in Settings and show it off with a poster.

## Put it online (once)

You need a free GitHub account and a free Netlify account.

1. Create a new GitHub repository and upload this whole folder (everything except `node_modules` and `.dev-data`).
2. In Netlify choose **Add new site → Import an existing project**, pick the repository. The settings are already in `netlify.toml` (publish folder `public`, functions in `netlify/functions`). Click **Deploy**.
3. In **Site configuration → Environment variables** add:
   - `TEACHER_EMAIL`: your email. The account you create with this email becomes the teacher account. (If you skip this, the first account ever created becomes the teacher, so register yourself first.)
   - `GOOGLE_CLIENT_ID`: only if you want Google sign-in (see below).
   - `AUTH_SECRET`: optional long random text. If you leave it out, the site makes its own and stores it.
4. Redeploy once after adding variables (**Deploys → Trigger deploy**).
5. Open your site, choose **Create account** with your teacher email. A **Teacher desk** button appears at the top.

In **Site configuration → Domain management** you can rename the site (for example `clivedu.netlify.app`). Choose the name once and the link stays the same forever.

## Updating the site without changing the link

There are two kinds of updates, and neither changes the link:

- **Content** (lessons, slides, word sets, homework, announcements): use the **Teacher desk** on the site itself. It is live immediately, no deploy needed.
- **Design or features**: edit the files, push to GitHub, and Netlify republishes the same site automatically. Visitors get the new version on their next visit.

## Teacher desk quick guide

- **Lessons → New lesson**: write a title, then upload **both** files if you have them. The **PDF** (File → Export → PDF, under about 18 MB) is shown on the site and its first slides (3 by default) are a free preview. The **PowerPoint (.pptx)** is a download that unlocks together with the slides. Choose "Only students I grant" to lock the deck. Each note can have an Uzbek explanation.
- **Students**: approve access requests, or switch a lesson on for one student or the whole class.
- **Students → Student levels**: students pick A1–C1 when they sign up; you set the real level here. They cannot change it themselves. Lessons and games show their level first.
- **Vocabulary**: paste one word per line as `word | pos | meaning | example | similar, words | Uzbek translation`. Similar words that exist elsewhere become linked stars in the galaxy.
- **Homework**: send to the whole class or chosen students. Students see a badge and, if they opted in, a notification.
- **Announcements**: a banner on the home page and an optional star of the day.
- **Import / Add starter lessons and words** loads the built-in examples (35 lessons, 23 word sets, all with Uzbek). Use "Add / refresh" after a site update to receive new built-in content; items with the same name are replaced.

## Language

The site opens in Uzbek (menus and word translations). Students can switch with the UZ/EN button or in Settings.

## Google sign-in (optional)

1. Open Google Cloud Console → **APIs & Services → Credentials → Create credentials → OAuth client ID**, type **Web application**.
2. Under **Authorized JavaScript origins** add your site address (for example `https://clivedu.netlify.app`).
3. Copy the client ID into the `GOOGLE_CLIENT_ID` environment variable in Netlify and redeploy.

## Class arena (group games)

Open **Play → Class arena** on the screen you project. Pick a game, a word set and the teams. Space reveals or moves on, keys 1 to 6 give points to a team. No student devices are needed.

## Run it on your own computer

```
node dev-server.mjs
```

Then open http://localhost:8888. Data is kept in a `.dev-data` folder (accounts, slides) and is separate from the real site.

## Good to know

- Homework notifications work while the site is open or installed as an app (the browser's "Install" / "Add to Home Screen"). Notifications that arrive when the site is fully closed need a push service, which can be added later.
- Slide files are protected by login and by your access rules; students cannot download them from the site, but anyone who can view a slide on screen can screenshot it.
- Slides and the Google sign-in button load from public CDNs (pdf.js from cdnjs, Google Identity Services, Google Fonts), so they need an internet connection.
