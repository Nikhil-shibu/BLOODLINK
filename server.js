const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase
const serviceAccount = require("./firebase-config.json"); // Add your Firebase config
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "url"
});
const db = admin.firestore();

// Twilio Config
const accountSid = "---------------your twilio sid --------------------";
const authToken = "twilio token";
const twilioClient = twilio(accountSid, authToken);
const twilioNumber = "number";

// User Registration (Donor or Recipient)
app.post('/register', async (req, res) => {
  const { name, phone, bloodType, location, lat, lng} = req.body;
  try {
    await db.collection('users').add({ name, phone, bloodType, location,lat, lng});
    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
  }
});

// Find Matching Donors
app.post('/find-donors', async (req, res) => {
  const { bloodType, location } = req.body;
  try {
    const donors = await db.collection('users')
      .where('bloodType', '==', bloodType)
      .get();
    
      const donorList = donors.docs.map(doc => {
        const donorData = doc.data();
        return {
            name: donorData.name,
            phone: donorData.phone,
            location:donorData.location,
            bloodType: donorData.bloodType
        };
      });
  
      res.status(200).json({ donors: donorList });
    } catch (error) {
      res.status(500).json({ error: "Error finding donors" });
    }
  });

// Send SMS Alerts to Nearby Donors
app.post('/notify-donors', async (req, res) => {
  const { bloodType, location } = req.body;
  try {
    const donors = await db.collection('users')
      .where('bloodType', '==', bloodType)
      .get();
    
    const donorNumbers = donors.docs.map(doc => doc.data().phone);
    donorNumbers.forEach(number => {
      twilioClient.messages.create({
        body: `Urgent! A patient near ${location} needs ${bloodType} blood. Please donate if you can!`,
        from: twilioNumber,
        to: number
      });
    });
    
    res.status(200).json({ message: "Donors notified successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error notifying donors" });
  }
});

// Post a Blood Request
app.post('/request', async (req, res) => {
  const { patientName, bloodType, location, contact } = req.body;
  try {
    await db.collection('requests').add({ patientName, bloodType, location, contact, timestamp: new Date() });
    res.status(200).json({ message: "Blood request posted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error posting blood request" });
  }
});


// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));