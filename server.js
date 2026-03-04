import { GoogleGenerativeAI } from "@google/generative-ai"
import express from "express"
import axios from "axios"
import bodyParser from "body-parser"

const app = express()
app.use(bodyParser.json())

/* ---------------- SETTINGS ---------------- */

const VERIFY_TOKEN = process.env.VERIFY_TOKEN
const ACCESS_TOKEN = process.env.ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

/* ---------------- GEMINI ---------------- */

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
})

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

      const reply = await getBotReply(text)

      await sendMessage(from, reply)

    }

  }

  res.sendStatus(200)

})

/* ---------------- BOT LOGIC ---------------- */

async function getBotReply(text) {

  try {

    const prompt = `
You are a friendly WhatsApp assistant for Lakme Salon.

Services:
Haircut ₹500
Facial ₹1200
Makeup ₹2500

Rules:
- Be polite
- Reply in short messages
- Help customers with salon services
- If user greets, welcome them.

User message: ${text}
`

    const result = await model.generateContent(prompt)

    return result.response.text()

  } catch (err) {

    console.log("AI error:", err)

    return "Sorry, I'm having trouble replying right now."

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