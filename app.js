const path = require("path");
const axios = require("axios");
const venom = require("venom-bot");
const { unlinkSync } = require("fs");
const puppeteer = require("puppeteer");
const schedule = require("node-schedule");
const { createWorker } = require("tesseract.js");

// ---------------------------------------------------------------------- [CONFIG] ----------------
// Venom
const venomInstanceName = "whatsapp_cih_bot_instance";
// Node-Schedule
const nodeScheduleCron = "0 7 * * *";
// CIH data
const cihServicePhoneNumber = "2120522479947";
const cihServiceSenderName = "CIH BANK";
const cihServicePayloadMenu = "Menu";
const cihServicePayloadSolde = "Solde";
// Pupperteer
const screenshotFileName = "balance.png";
// Gotify
const gotifyUrl = "http://10.0.0.4:8001/message?token=A5aTZRSUr.AXzqN";
// Common
const imageFilePath = path.resolve(__dirname, screenshotFileName);

// ---------------------------------------------------------------------- [App] -------------------

const sendToGotify = (title, message, deleteImage) => {
	axios({
		url: gotifyUrl,
		data: {
			title,
			message,
			priority: 10,
		},
		method: "post",
		headers: { "Content-Type": "application/json" },
	})
		.then(() => {
			if (deleteImage) unlinkSync(imageFilePath);
		})
		.catch(error => logErrors(error));
};

const logErrors = error => {
	console.error(error);
	sendToGotify("CIH Bot - Error", error, false);
};

const recognizeBalance = async () => {
	const worker = createWorker();

	await worker.load();
	await worker.loadLanguage("eng");
	await worker.initialize("eng");

	const {
		data: { text },
	} = await worker.recognize(imageFilePath);

	await worker.terminate();

	sendToGotify(
		"CIH Bot - Bank Accounts' Balances",
		text.replace(/Historique|9 | >/g, ""),
		true
	);
};

const start = async client => {
	schedule.scheduleJob(nodeScheduleCron, async () => {
		await client
			.sendText(`${cihServicePhoneNumber}@c.us`, cihServicePayloadSolde)
			.catch(error => logErrors(error));
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
	.catch(error => logErrors(error));
