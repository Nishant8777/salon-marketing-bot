import express from "express"
import axios from "axios"
import bodyParser from "body-parser"

const app = express()
app.use(bodyParser.json())

/* ---------------- SETTINGS ---------------- */

const VERIFY_TOKEN = process.env.VERIFY_TOKEN
const ACCESS_TOKEN = process.env.ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID

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
      const text = message.text?.body || ""

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

  const menu = `
👋 Welcome to Lakme Salon

Please choose an option:

1️⃣ Services
2️⃣ Book Appointment
3️⃣ Price List
4️⃣ Current Offers
5️⃣ Talk to Support
`

  /* greetings */

  if (
    text.includes("hi") ||
    text.includes("hello") ||
    text.includes("hey")
  ) {
    return menu
  }

  /* menu */

  if (text === "menu") {
    return menu
  }

  /* services */

  if (
    text === "1" ||
    text.includes("services")
  ) {

    return `
💇 Our Services

Haircut
Facial
Makeup
Hair Coloring
Manicure
Pedicure

Reply with a service name to know the price.
`
  }

  /* price list */

  if (
    text === "3" ||
    text.includes("price")
  ) {

    return `
💰 Price List

Haircut — ₹500
Facial — ₹1200
Makeup — ₹2500
Hair Color — ₹2000
Manicure — ₹800
Pedicure — ₹900
`
  }

  /* offers */

  if (
    text === "4" ||
    text.includes("offer")
  ) {

    return `
🎉 Current Offers

20% OFF on Haircut this week!

Free consultation with Facial treatment.
`
  }

  /* booking */

  if (
    text === "2" ||
    text.includes("book")
  ) {

    return `
📅 Appointment Booking

Please send:

Name
Service
Preferred Date
Preferred Time

Example:
Nishant
Haircut
Friday
5 PM
`
  }

  /* specific service questions */

  if (text.includes("haircut")) {
    return "💇 Haircut starts from ₹500.\nWould you like to book an appointment?"
  }

  if (text.includes("facial")) {
    return "💆 Facial service costs ₹1200.\nWould you like to book?"
  }

  if (text.includes("makeup")) {
    return "💄 Makeup service costs ₹2500."
  }

  if (text.includes("manicure")) {
    return "💅 Manicure costs ₹800."
  }

  if (text.includes("pedicure")) {
    return "🦶 Pedicure costs ₹900."
  }

  if (text.includes("color")) {
    return "🎨 Hair coloring starts from ₹2000."
  }

  /* support */

  if (text === "5" || text.includes("support")) {
    return "Our team will contact you shortly. 😊"
  }

  /* fallback */

  return `
Sorry, I didn't understand.

Type *menu* to see options.
`
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