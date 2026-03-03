import express from "express"
import axios from "axios"
import bodyParser from "body-parser"

const app = express()
app.use(bodyParser.json())

/* ---------------- SETTINGS ---------------- */

const VERIFY_TOKEN = "salon_verify_123"

const ACCESS_TOKEN = "EAAbkyaOFBiABQ0RAA9VsT8gWtcNEVFgyNju4UIJwamm2lbZAmpZCby6z3h3THn6wZCjU1oEGj1BgbMLDLScVH05Y33dOZA5U8IuOJhfgenkjKf8N0fUnBrmyLn0NnEYJ7SL3PO2YcReNmW95Jq2ZAVvoVFy0dRgmqWJubPZB1nheo36b1r14x1HstMZBho2JzetP5BRAaTGYFVwgABG0fQAhfAJWl7UUsSR3RSZAXPTFO7Q0OihIN0B4VES9bPQnsR5EBa8CmvdmX5109t5VeRKe"

const PHONE_NUMBER_ID = "910037188870426"

/* ---------------- WEBHOOK VERIFY ---------------- */

app.get("/webhook",(req,res)=>{

const mode = req.query["hub.mode"]
const token = req.query["hub.verify_token"]
const challenge = req.query["hub.challenge"]

if(mode === "subscribe" && token === VERIFY_TOKEN){

console.log("Webhook verified")

res.status(200).send(challenge)

}else{

res.sendStatus(403)

}

})

/* ---------------- RECEIVE MESSAGE ---------------- */

app.post("/webhook",async(req,res)=>{

const body = req.body

if(body.entry){

const message =
body.entry[0].changes[0].value.messages?.[0]

if(message){

const from = message.from
const text = message.text?.body

console.log("User:",text)

const reply = getBotReply(text)

await sendMessage(from,reply)

}

}

res.sendStatus(200)

})

/* ---------------- BOT LOGIC ---------------- */

function getBotReply(text){

text = text.toLowerCase()

if(text === "hi" || text === "hello"){
return "Hello 👋 Welcome to Lakme Salon!"
}

if(text === "services"){
return "We offer Haircut, Facial, Makeup."
}

if(text === "price"){
return "Haircut starts from ₹500."
}

return "Sorry, I didn't understand. Type 'services' to see options."

}

/* ---------------- SEND MESSAGE ---------------- */

async function sendMessage(to,message){

try{

await axios.post(

`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,

{
messaging_product:"whatsapp",
to:to,
text:{body:message}
},

{
headers:{
Authorization:`Bearer ${ACCESS_TOKEN}`
}
}

)

}catch(err){

console.log(err.response?.data || err)

}

}

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
console.log("Bot running on port",PORT)
})