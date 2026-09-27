import mongoose from 'mongoose';

export const mochaHooks = {
  async afterAll() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  },
};
