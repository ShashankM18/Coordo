import mongoose from 'mongoose';
import 'dotenv/config';

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const invites = await mongoose.connection.collection('invites').find({}).toArray();
    console.log(JSON.stringify(invites.map(i => ({ email: i.email, status: i.status })), null, 2));
    process.exit(0);
  })
  .catch(console.error);
