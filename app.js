require('dotenv').config()

const axios = require('axios')
const venom = require('venom-bot')
const puppeteer = require('puppeteer')
const schedule = require('node-schedule')
const { createWorker } = require('tesseract.js')

// ---------------------------------------------------------------------- [CONFIG] ----------------
// Venom
const venomInstanceName = process.env.VENOM_INSTANCE_NAME || 'cih_bot_instance'
// Node-Schedule
const nodeScheduleCron = process.env.NODE_SCHEDULE_CRON || '0 7 * * *'
// CIH data
const cihServicePhoneNumber = process.env.CIH_SERVICE_NUMBER || '212522479947'
const cihServiceSenderName = process.env.CIH_SERVICE_SENDER_NAME || 'CIH BANK'
// Gotify
const gotifyUrl = process.env.GOTIFY_URL
const gotifyPriority = +process.env.GOTIFY_PRIORITY || 10
// Misc.
const appEnv = process.env.ENV || 'prod'

let currentTimestamp = null

// ---------------------------------------------------------------------- [App] -------------------

const getTimestamp = () => Math.floor(new Date().getTime() / 1000)

const readScreenshotContent = async (screenshotPath) => {
  const worker = createWorker()

  await worker.load()
  await worker.loadLanguage('fra')
  await worker.initialize('fra')
  const {
    data: { text },
  } = await worker.recognize(screenshotPath)
  await worker.terminate()

  return text
}

const sendToGotify = (title, message) => {
  axios({
    url: gotifyUrl,
    data: {
      title,
      message: message,
      priority: gotifyPriority,
    },
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
  })
    .then(() => console.log('[!] Data sent to Gotify endpoint'))
    .catch((error) => logError('[X] Error sending data to gotify: ', error))
}

const logError = (...error) => {
  console.error(...error)
  if (appEnv == 'prod') sendToGotify('CIH bot error', error)
}

const start = async (client) => {
  try {
    schedule.scheduleJob(nodeScheduleCron, async () => {
      console.log(`[!] Will send message to: ${cihServicePhoneNumber}@c.us, with payload: Solde`)
      await client.sendText(`${cihServicePhoneNumber}@c.us`, 'Solde')
    })
  } catch (error) {
    logError('[X] Error sending text: ', error)
  }

  try {
    client.onMessage(async (message) => {
      if (message.body && message.sender && message.sender.name === cihServiceSenderName) {
        console.time('operation_timing')
        console.log('[!] Start..')

        currentTimestamp = getTimestamp()
        console.log('[!] Current timestamp: ', currentTimestamp)

        const url = message.body.match(/\bhttps?:\/\/\S+/gim)[0]
        console.log('[!] URL found: ', url)

        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        console.log('[!] Created browser and page..')

        await page.setViewport({
          width: 600,
          height: 800,
          isMobile: true,
          deviceScaleFactor: 1,
        })

        console.log('[!] Heading to URL..')
        await page.goto(url.trim(), {
          waitUntil: 'networkidle0',
          timeout: 60000,
        })

        console.log('[!] 1st screenshot capturing..')
        await page.waitForTimeout(30000)
        await page.screenshot({
          path: `./screenshots/${currentTimestamp}_balance.png`,
          fullPage: true,
        })

        console.log('[!] 1st click..')
        await page.click(
          '.r-150rngu > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(2) > div:nth-child(1)'
        )

        console.log('[!] 2nd screenshot capturing..')
        await page.waitForTimeout(10000)
        await page.screenshot({
          path: `./screenshots/${currentTimestamp}_savings_account_details.png`,
          fullPage: true,
        })

        console.log('[!] 2nd click (going back)..')
        await page.click('.r-1kihuf0 > div:nth-child(1)')
        await page.waitForTimeout(10000)

        console.log('[!] 3rd click..')
        await page.click(
          '.r-150rngu > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(2) > div:nth-child(1)'
        )

        console.log('[!] 3rd screenshot capturing..')
        await page.waitForTimeout(10000)
        await page.screenshot({
          path: `./screenshots/${currentTimestamp}_main_account_details.png`,
          fullPage: true,
        })

        console.log('[!] Closing browser..')
        await browser.close()

        console.log('[!] Gathering data..')

        const balance = await readScreenshotContent(`./screenshots/${currentTimestamp}_balance.png`)

        const enhancedBalance = balance
          .replaceAll('° Consultation', '')
          .replaceAll('Historique >', '')
          .replaceAll('Solde Actuel :', 'Solde actuel: ')
          .replaceAll('Numéro de compte :', 'Numéro de compte: ')
          .trim()

        console.log('[!] Done gathering data, sending..')

        sendToGotify('CIH Bot - Bank accounts balance', enhancedBalance)

        console.timeEnd('operation_timing')
      }
    })
  } catch (error) {
    logError(`[X] Error receiving message: `, error)
  }
}

venom
  .create(venomInstanceName)
  .then((client) => start(client))
  .catch((error) => logError('[X] Venom instance creation error: ', error))
