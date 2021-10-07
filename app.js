const path = require("path");
const axios = require("axios");
const venom = require("venom-bot");
const { unlinkSync } = require("fs");
const puppeteer = require("puppeteer");
const schedule = require("node-schedule");
const { createWorker } = require("tesseract.js");

// ---------------------------------------------------------------------- [CONFIG] ----------------
// Venom
const venom_instance_name = "whatsapp_cih_bot_instance";
// Node-Schedule
const node_schedule_cron = "0 7 * * *";
// CIH data
const cih_service_phone_number = "2120522479947";
const cih_service_sender_name = "CIH BANK";
const cih_service_payload_menu = "Menu";
const cih_service_payload_solde = "Solde";
// Pupperteer
const screenshot_file_name = "balance.png";
// Gotify
const gotify_url = "http://10.0.0.4:8001/message?token=A5aTZRSUr.AXzqN";
// Common
const image_file_path = path.resolve(__dirname, screenshot_file_name);

// ---------------------------------------------------------------------- [App] -------------------

const delete_balance_image = () => unlinkSync(image_file_path);

const send_balance = payload => {
	axios({
		url: gotify_url,
		data: {
			title: "CIH Bot - Bank Accounts' Balances",
			message: payload,
			priority: 10,
		},
		method: "post",
		headers: { "Content-Type": "application/json" },
	})
		.then(() => delete_balance_image())
		.catch(error => console.error(error));
};

const recognize_balance = async () => {
	const worker = createWorker();

	await worker.load();
	await worker.loadLanguage("eng");
	await worker.initialize("eng");

	const {
		data: { text },
	} = await worker.recognize(image_file_path);

	let cleanText = text.replace(/Historique|9 /g, "");

	await worker.terminate();

	send_balance(cleanText);
};

const start = async client => {
	schedule.scheduleJob(node_schedule_cron, async () => {
		await client
			.sendText(`${cih_service_phone_number}@c.us`, cih_service_payload_solde)
			.catch(error => console.error(error));
	});

	client.onMessage(async message => {
		if (
			message.body &&
			message.sender &&
			message.sender.name === cih_service_sender_name
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
			await page.screenshot({ path: screenshot_file_name, fullPage: true });
			await browser.close();

			recognize_balance();
		}
	});
};

venom
	.create(venom_instance_name)
	.then(client => start(client))
	.catch(error => console.error(error));
