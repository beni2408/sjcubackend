import mongoose from 'mongoose';

// If connection drops, queries queue up then fail immediately rather than hanging
mongoose.set('bufferCommands', false);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName:                    'sjcu_platform',
      serverSelectionTimeoutMS:  8000,   // fail fast if Atlas is unreachable
      socketTimeoutMS:           30000,  // abort hanging queries after 30s
      connectTimeoutMS:          10000,  // TCP connect timeout
      maxPoolSize:               10,     // connection pool
      minPoolSize:               2,
      heartbeatFrequencyMS:      10000,  // check connection health every 10s
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — attempting reconnect…');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });

  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.log('⏳ Retrying in 5 seconds…');
    await new Promise(r => setTimeout(r, 5000));
    return connectDB();
  }
};
