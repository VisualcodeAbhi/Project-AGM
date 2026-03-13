const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://abhilashdurgam0_db_user:KZOl6ANdJdt1Jr1W@cluster0.jppct2m.mongodb.net/agapeministries?retryWrites=true&w=majority&appName=Cluster0';

const DeviceTokenSchema = new mongoose.Schema({ token: { type: String, unique: true } }, { timestamps: true });
const DeviceToken = mongoose.model('DeviceToken', DeviceTokenSchema);

async function checkTokens() {
    try {
        await mongoose.connect(mongoURI);
        const tokens = await DeviceToken.find();
        console.log(`Total active device tokens: ${tokens.length}`);
        tokens.forEach((t, i) => console.log(`${i+1}: ${t.token.substring(0, 10)}...`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTokens();
