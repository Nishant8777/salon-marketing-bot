import express from "express"
import axios from "axios"
import bodyParser from "body-parser"

const app = express()
app.use(bodyParser.json())

/* ---------------- SETTINGS ---------------- */

const VERIFY_TOKEN = "salon_verify_123"

const ACCESS_TOKEN = "EAAbkyaOFBiABQuL0Sj57SOtZBczPdzaMliEFZBiAqa5s8Vl18ZCzIS70fJWnp1JZCxeUoBP2YR4r5dolns8PcsrXIVCzpCaP9i2qpcY5vdZB2Nu3QwdQ2NMTEAtnqtavfnYwl8gYELZCjp7VQzYPsT650PFlOJhObjkABIcf7YUAMHvw3GLZC7z1TSoaLl7vQZDZD"

const PHONE_NUMBER_ID = "910037188870426"

/* ---------------- WEBHOOK VERIFY ---------------- */

app.get("/webhook", (req, res) => {

    const mode = req.query["hub.mode"]
    const token = req.query["hub.verify_token"]
    const challenge = req.query["hub.challenge"]

    if (mode === "subscribe" && token === VERIFY_TOKEN) {

        console.log("Webhook verified")

        res.status(200).send(challenge)

    } else {

        res.sendStatus(403)

    }

})

/* ---------------- RECEIVE MESSAGE ---------------- */

app.post("/webhook", async (req, res) => {

    const body = req.body

    if (body.entry) {

        const message =
            body.entry[0].changes[0].value.messages?.[0]

        if (message) {

            const from = message.from
            const text = message.text?.body

            console.log("User:", text)

            const reply = getBotReply(text)

            await sendMessage(from, reply)

        }

    }

    res.sendStatus(200)

})

/* ---------------- BOT LOGIC ---------------- */

function getBotReply(text) {

    text = text.toLowerCase().trim()

    // MENU
    const menu = `Hello 👋 Welcome to Lakme Salon

Please choose an option:

1️⃣ Services
2️⃣ Book Appointment
3️⃣ Price List
4️⃣ Offers
5️⃣ Talk to Human`


    // If user sends anything other than numbers → show menu
    if (!["1", "2", "3", "4", "5"].includes(text)) {
        return menu
    }


    if (text === "1") {
        return `Our services:

💇 Haircut
💄 Makeup
💆 Facial
💅 Manicure & Pedicure`
    }

    if (text === "2") {
        return `To book an appointment please send:

Name:
Preferred Service:
Preferred Date:`
    }

    if (text === "3") {
        return `Price List:

Haircut — ₹500
Facial — ₹1200
Makeup — ₹2500`
    }

    if (text === "4") {
        return `🎉 Current Offers

20% off on Haircut this week!
Free consultation with Facial.`
    }

    if (text === "5") {
        return `Connecting you to our support team. Please wait.`
    }

}

/* ---------------- SEND MESSAGE ---------------- */

async function sendMessage(to, message) {

    try {

        await axios.post(

            `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,

            {
                messaging_product: "whatsapp",
                to: to,
                text: { body: message }
            },

            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                }
            }

        )

    } catch (err) {

        console.log(err.response?.data || err)

    }

}

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("Bot running on port", PORT)
})