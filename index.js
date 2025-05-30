import express from "express";
import { connectDB } from "./config/db.js";
import colors from "colors";
import colleges from "./routes/collegesRoutes.js";
import departments from "./routes/departmensRoutes.js";
import users from "./routes/userRoutes.js";
import schedules from "./routes/schedulesRoutes.js";
import thesisDocumentRoutes from "./routes/thesisDocumentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import favoriteRoutes from "./routes/favoritesRoutes.js";
import notificationsRoutes from "./routes/notificationRoutes.js";
import adviserAcceptanceRoutes from "./routes/adviserAcceptanceRoute.js";
import panelApprovalRoutes from "./routes/panelApprovalRoutes.js";
import cors from "cors";
connectDB();

const app = express();
const port = process.env.PORT;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/users", users);
app.use("/api/colleges", colleges);
app.use("/api/departments", departments);
app.use("/api/schedules", schedules);
app.use("/api/thesisDocuments", thesisDocumentRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/adviserAcceptance", adviserAcceptanceRoutes);
app.use("/api/panelApproval", panelApprovalRoutes);
app.listen(port, () => {
  console.log(`running on port ${port}`);
});
