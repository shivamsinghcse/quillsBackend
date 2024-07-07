import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser";
import express from "express";
import z from "zod";
import bcrypt from "bcryptjs";
import jwt, { decode } from "jsonwebtoken";

const PORT = "3000";
const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
const buySchema = z.object({
  product: z.string().array(),
  quantity: z.number(),
  customer: z.string().array(),
});
function authMiddleware(req: any, res: any, next: any) {
  const reqtoken = req.headers["authorization"];
  if (reqtoken !== undefined) {
    const data = reqtoken.split(" ");
    const token = data[1];
    const varify = jwt.verify(
      token,
      "mysupersecreatpassword",
      (err: any, decode: any) => {
        if (err) {
          res.status(401).json({
            msg: "Invalid token",
          });
        } else {
          next();
        }
      }
    );
  }
}
app.post("/signin", async (req, res) => {
  const userdata = await req.body;
  const validate = signInSchema.safeParse(userdata);
  console.log(validate.data);
  if (validate.success) {
    const user = await prisma.user.findUnique({
      where: { email: validate.data.email },
    });
    if (!user) {
      res.status(401).json({
        msg: "Login Credintials are Incorrect",
      });
    } else {
      const passwordValidate = await bcrypt.compare(
        validate.data.password,
        user.password
      );
      if (passwordValidate) {
        res.status(401).json({
          msg: "Login Credintials are Incorrect",
        });
      }
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        "mysupersecreatpassword"
      );
      res.status(200).json({ token });
    }
  }
});
app.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const data = await prisma.orders.findMany();
    res.status(200).json({
      msg: "Success",
      data: data,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});
app.post("/buy", async (req, res) => {
  const reqData = req.body;
  const validateBuy = buySchema.safeParse(reqData);
  if (validateBuy.success) {
    try {
      const uploadData = await prisma.orders.create({
        data: validateBuy.data,
      });
      res.status(200).json({
        msg: uploadData
      })
    } catch (error) {
      res.status(500).json({
        msg: "internal server error",
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`[ Ready ] http://localhost:${PORT}`);
});
