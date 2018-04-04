const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const cronJob = require('cron').CronJob;

require('dotenv/config');

const SAWNEE_URL = 'https://sawnee.smarthub.coop/Login.html#login:';
const ATTIS_URL = 'https://property.onesite.realpage.com/welcomehome?siteId=3712014#url=%23login';

async function run() {
    console.log(process.env.SAWNEE_PASSWORD);
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(SAWNEE_URL);
    await page.waitForSelector('#LoginUsernameTextBox');
    await page.type('#LoginUsernameTextBox', process.env.SAWNEE_USERNAME);
    await page.type('#LoginPasswordTextBox', process.env.SAWNEE_PASSWORD);
    await page.click('#LoginSubmitButton');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    // extracting the total due from the page (until cleaner way is found)
    let sawneeTotalDue = await page.evaluate(function () { return document.getElementsByClassName('gwt-Label ce-contentTitle')[2].textContent });
    await page.goto(ATTIS_URL);
    await page.waitForNavigation({ waitUntil: 'load' });
    await page.type('#loginuser', process.env.ATTIS_USERNAME);
    await page.type('#loginpass', process.env.ATTIS_PASSWORD);
    await page.click('#btnSubmitLogon');
    await page.waitFor(6000);
    // extracting the total due from the page (until cleaner way is found)
    let attisTotalDue = await page.evaluate(function () { return document.getElementById('spnCurrentAmountDue').textContent });
    sendText(sawneeTotalDue, attisTotalDue);
    await browser.close();
}

function sendText(sawneeTotalDue, attisTotalDue) {

    let transporter = buildTransporter();
    let mailOptions = constructMailOptions(sawneeTotalDue, attisTotalDue);

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    });
}

function buildTransporter() {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_PASSWORD
        }
    });

    return transporter;
}

function constructMailOptions(sawneeTotalDue, attisTotalDue) {
    const mailOptions = {
        from: process.env.GMAIL_USERNAME, // sender address
        to: process.env.PHONE_EMAIL, // list of receivers
        subject: 'Bill Payments', // Subject line
        text: 'Sawnee Total: ' + sawneeTotalDue + ' Attis Total: ' + attisTotalDue, // plain text body
        html: '<b>TestingNodemailer</b>' // html body
    };

    return mailOptions;
}

run();
/*
new cronJob('30 * * * * *', function() {
    run();
  }, null, true, 'America/New_York');
*/