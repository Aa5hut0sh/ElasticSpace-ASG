import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.route";
import workspaceRoutes from "./routes/workspace.route";
dotenv.config();
import {redis} from "./redis/client"


const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cors({
  origin:"*"
}));

//redis connection
await redis.connect().then(()=>{
  console.log("Redis connected");
}).catch((err)=>{
  console.log(err);
});



app.use("/health" , (req,res)=>{
  res.send("system is up");
})

app.use("/api/user" , userRoutes);
app.use("/api/workspace" , workspaceRoutes);



app.listen(PORT, () => {
  console.log(`App is listening on PORT ${PORT}`);
});

