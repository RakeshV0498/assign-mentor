import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbName = process.env.DB_NAME || "";

const dbCluster = process.env.DB_CLUSTER || "";

const dbUser = process.env.DB_USER || "";

const dbPassword = process.env.DB_PASSWORD || "";

const URI = `mongodb+srv://${dbUser}:${dbPassword}@${dbCluster}/${dbName}?retryWrites=true&w=majority&appName=rakeshCluster`;

const mongoAtlasConnect = async () => {
  try {
    await mongoose.connect(URI);
    console.log("DB Connected Successfully");
  } catch (error) {
    console.error(error);
  }
};

export default mongoAtlasConnect;
