# WhatsApp CIH Bot

This app's goal is to get personal accounts' balances in a legal way by using CIH Bank's WhatsApp service, hint, in order to use this script/app you will need to enable this feature from your CIH application.

## What's inside ?

- [Venpm](https://github.com/orkestral/venom) as a WhatsApp client
- [Puppeteer](https://github.com/puppeteer/puppeteer) as a headless browser
- [Tesseract.js](https://github.com/naptha/tesseract.js) as an OCR
- [Node Schedule](https://github.com/node-schedule/node-schedule) as a scheduler
- [Axios](https://github.com/axios/axios) as an HTTP client
- [Dotenv](https://github.com/motdotla/dotenv) used to load env. variables

---

## How to

### **Run**

1- Create a `.env` file based on the `.env.template` file and adapt as needed.

2- Install a browser if its not installed (needed in a server installation/deployment)

3- Run `npm run start`

4- Scan the QR code

### **Deployment** (using [PM2](https://github.com/Unitech/pm2))

1- Do, 1, 2 from the previous section (`Run` section)

2- Install PM2

3- Run `pm2 start /home/razinj/pm2-apps/whatsapp-cih-bot/app.js --name whatsapp-cih-bot`

4- Run `pm2 logs <APP_ID>` (run `pm2 list` to check the app ID) or just cat it `cat /home/razinj/.pm2/logs/whatsapp-cih-bot-*.log`

5- Scan the QR code

---

## Output sample

```text
Consultation
COMPTE SUR CARNET
Numéro de compte ################
Solde Actuel :#### MAD

COMPTE CHEQUE
Numéro de compte ################
Solde Actuel :#### MAD
```

### Final words

Your imagination is the limit, clone/fork the repo and add as much needed modification or functionalities.

I will shamelessly link my post on how to [install Gotify server](https://razinj.dev/how-to-install-gotify-docker-compose/) in case needed.
