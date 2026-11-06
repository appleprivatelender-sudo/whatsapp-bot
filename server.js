const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "mysecret123"; // same as you put in Meta
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // you will set in Render
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // you will set in Render

// 1. VERIFICATION FOR META - THIS IS WHAT YOU NEED
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("WEBHOOK VERIFIED!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2. RECEIVE MESSAGES
app.post('/webhook', async (req, res) => {
  const body = req.body;
  
  if (body.object) {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || "Hi";

      console.log(`Message from ${from}: ${text}`);

      // Auto reply
      try {
        await axios({
          method: 'POST',
          url: `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          },
          data: {
            messaging_product: 'whatsapp',
            to: from,
            text: { body: `You said: ${text}\n\nI'm your support bot! How can I help?` }
          }
        });
      } catch (e) {
        console.log("Error sending:", e.response?.data || e.message);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.get('/', (req, res) => {
  res.send('WhatsApp bot is running! Webhook at /webhook');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
