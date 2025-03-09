import express from "express";
import { connectDB } from "./config/db.js";
import colors from "colors";
import colleges from "./routes/collegesRoutes.js";
import departments from "./routes/departmensRoutes.js";
import users from "./routes/userRoutes.js";
import schedules from "./routes/schedulesRoutes.js";
import thesisDocumentRoutes from "./routes/thesisDocumentRoutes.js";
import { userLogin } from "./controller/authController.js";
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const port = process.env.PORT;

app.post("/api/login", userLogin);
app.use("/api/users", users);
app.use("/api/colleges", colleges);
app.use("/api/departments", departments);
app.use("/api/schedules", schedules);
app.use("/api/thesisDocuments", thesisDocumentRoutes);

app.listen(port, () => {
  console.log(`running on port ${port}`);
});
