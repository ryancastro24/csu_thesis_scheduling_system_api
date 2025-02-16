import express from "express";
import { connectDB } from "./config/db.js";
import colors from "colors";
import colleges from "./routes/collegesRoutes.js";
import departments from "./routes/departmensRoutes.js";
import users from "./routes/userRoutes.js";
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const port = process.env.PORT;

app.use("/api/users", users);
app.use("/api/colleges", colleges);
app.use("/api/departments", departments);

app.listen(port, () => {
  console.log(`running on port ${port}`);
});
