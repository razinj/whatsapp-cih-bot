# WhatsApp CIH Bot

This app's goal is to get personal accounts balance in a legal way by using [CIH](https://www.cihbank.ma) bank's WhatsApp service, hint, in order to use this app you will need to enable this feature from your CIH application.

## What's inside?

- [Venom](https://github.com/orkestral/venom) as a WhatsApp client
- [Puppeteer](https://github.com/puppeteer/puppeteer) as a headless browser
- [Tesseract.js](https://github.com/naptha/tesseract.js) as an OCR
- [Node Schedule](https://github.com/node-schedule/node-schedule) as a scheduler
- [Axios](https://github.com/axios/axios) as an HTTP client
- [Dotenv](https://github.com/motdotla/dotenv) used to load env. variables

## How to

### Run

1. Create a `.env` file based on the `.env.template` file and adapt as needed.
2. Install a browser if its not installed (needed even in a server deployment)
3. Run `npm run start`
4. Scan the QR code

### Deploy (using [PM2](https://github.com/Unitech/pm2))

1. Do step `1` and `2` from the `Run` section
2. Install PM2 (check the official docs for it)
3. Run `pm2 start /home/razinj/pm2-apps/whatsapp-cih-bot/app.js --name whatsapp-cih-bot`
4. Run `pm2 logs <APP_ID>` (run `pm2 list` to check the app ID) or just _cat_ it `cat /home/razinj/.pm2/logs/whatsapp-cih-bot-*.log`
5. Scan the QR code

## Output sample (balance only, history pages aren't OCR'ed)

```
COMPTE SUR CARNET
Numéro de compte: ################
Solde actuel: #### MAD

COMPTE CHEQUE
Numéro de compte: ################
Solde actuel: #### MAD
```

## Finally

If you like the app, give it a star ⭐ and share it with your friends.

Your imagination is the limit, clone/fork the repo, adapt and/or add as much needed modifications or functionalities.

Wondering how to install Gotify? I will link my post on how to [install Gotify server](https://razinj.dev/how-to-install-gotify-docker-compose) in case needed.
