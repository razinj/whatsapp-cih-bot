require("dotenv").config();

const axios = require("axios");
const venom = require("venom-bot");
const puppeteer = require("puppeteer");
const schedule = require("node-schedule");

// ---------------------------------------------------------------------- [CONFIG] ----------------
// Venom
const venomInstanceName = process.env.VENOM_INSTANCE_NAME || "cih_bot_instance";
// Node-Schedule
const nodeScheduleCron = process.env.NODE_SCHEDULE_CRON || "0 7 * * *";
// CIH data
const cihServicePhoneNumber = process.env.CIH_SERVICE_NUMBER || "2120522479947";
const cihServiceSenderName = process.env.CIH_SERVICE_SENDER_NAME || "CIH BANK";
const cihServicePayloadSolde = "Solde";
// Gotify
const gotifyUrl = process.env.GOTIFY_URL;
// Common
const appEnv = process.env.ENV || "prod";

let currentTimestamp = null;

// ---------------------------------------------------------------------- [App] -------------------

const getTimestamp = () => Math.floor(new Date().getTime() / 1000);

const sendToGotify = (title, message) => {
	axios({
		url: gotifyUrl,
		data: {
			title,
			message: message || getMessageTemplate(),
			priority:
				process.env.GOTIFY_PRIORITY == null ? 10 : +process.env.GOTIFY_PRIORITY,
			extras: {
				"client::display": {
					contentType: "text/markdown",
				},
			},
		},
		method: "post",
		headers: { "Content-Type": "application/json" },
	}).catch(error => logError(error));
};

const logError = error => {
	console.error(error);
	if (appEnv == "prod") sendToGotify("CIH Bot - Error", error);
};

const getMessageTemplate = () => {
	return `
**Balance**\n
![Balance](http://10.0.0.2:8080/screenshots/balance_${currentTimestamp}.png)\n
**Saving account History**\n
![Saving account](http://10.0.0.2:8080/screenshots/savings_account_details_${currentTimestamp}.png)\n
**Main account History**\n
![Main account](http://10.0.0.2:8080/screenshots/main_account_details_${currentTimestamp}.png)
`;
};

const start = async client => {
	schedule.scheduleJob(nodeScheduleCron, async () => {
		await client
			.sendText(`${cihServicePhoneNumber}@c.us`, cihServicePayloadSolde)
			.catch(error => logError(error));
	});

	client.onMessage(async message => {
		if (
			message.body &&
			message.sender &&
			message.sender.name === cihServiceSenderName
		) {
			currentTimestamp = getTimestamp();

			const url = message.body.match(/\bhttps?:\/\/\S+/gim)[0];

			const browser = await puppeteer.launch();
			const page = await browser.newPage();

			await page.setViewport({
				width: 400,
				height: 600,
				isMobile: true,
				deviceScaleFactor: 1,
			});
			await page.goto(url.trim(), {
				waitUntil: "networkidle0",
				timeout: 60000,
			});

			await page.waitForTimeout(30000);
			await page.screenshot({
				path: `./screenshots/balance_${currentTimestamp}.png`,
				fullPage: true,
			});

			await page.click(
				".r-150rngu > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(2) > div:nth-child(1)"
			);
			await page.waitForTimeout(10000);
			await page.screenshot({
				path: `./screenshots/savings_account_details_${currentTimestamp}.png`,
				fullPage: true,
			});

			await page.click(".r-1kihuf0 > div:nth-child(1)");
			await page.waitForTimeout(10000);

			await page.click(
				".r-150rngu > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(2) > div:nth-child(1)"
			);
			await page.waitForTimeout(10000);
			await page.screenshot({
				path: `./screenshots/main_account_details_${currentTimestamp}.png`,
				fullPage: true,
			});

			await browser.close();

			sendToGotify("CIH Bot - Bank Accounts' Balances");
		}
	});
};

venom
	.create(venomInstanceName)
	.then(client => start(client))
	.catch(error => logError(error));
