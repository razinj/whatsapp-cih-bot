require("dotenv").config();

const path = require("path");
const axios = require("axios");
const venom = require("venom-bot");
const { unlinkSync } = require("fs");
const puppeteer = require("puppeteer");
const schedule = require("node-schedule");
const { createWorker } = require("tesseract.js");

// ---------------------------------------------------------------------- [CONFIG] ----------------
// Venom
const venomInstanceName = process.env.VENOM_INSTANCE_NAME || "cih_bot_instance";
// Node-Schedule
const nodeScheduleCron = process.env.NODE_SCHEDULE_CRON || "0 7 * * *";
// CIH data
const cihServicePhoneNumber = process.env.CIH_SERVICE_NUMBER || "2120522479947";
const cihServiceSenderName = process.env.CIH_SERVICE_SENDER_NAME || "CIH BANK";
const cihServicePayloadSolde = "Solde";
// Pupperteer
const screenshotFileName = "balance.png";
// Gotify
const gotifyUrl = process.env.GOTIFY_URL;
// Common
const appEnv = process.env.ENV || "prod";
const imageFilePath = path.resolve(__dirname, screenshotFileName);

// ---------------------------------------------------------------------- [App] -------------------

const sendToGotify = (title, message, deleteImage) => {
	axios({
		url: gotifyUrl,
		data: {
			title,
			message,
			priority: +process.env.GOTIFY_PRIORITY || 10,
		},
		method: "post",
		headers: { "Content-Type": "application/json" },
	})
		.then(() => {
			if (deleteImage) unlinkSync(imageFilePath);
		})
		.catch(error => logError(error));
};

const logError = error => {
	console.error(error);
	if (appEnv == "prod") sendToGotify("CIH Bot - Error", error, false);
};

const recognizeBalance = async () => {
	const worker = createWorker();

	await worker.load();
	await worker.loadLanguage("fra");
	await worker.initialize("fra");

	const {
		data: { text },
	} = await worker.recognize(imageFilePath);

	await worker.terminate();

	sendToGotify(
		"CIH Bot - Bank Accounts' Balances",
		text.replace(/Historique —|Historique >|° /g, ""),
		true
	);
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
			await page.screenshot({ path: screenshotFileName, fullPage: true });
			await browser.close();

			recognizeBalance();
		}
	});
};

venom
	.create(venomInstanceName)
	.then(client => start(client))
	.catch(error => logError(error));
