"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const zod_1 = __importDefault(require("zod"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const PORT = '3000';
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const signInSchema = zod_1.default.object({
    email: zod_1.default.string().email(),
    password: zod_1.default.string().min(6)
});
function authMiddleware(req, res, next) {
    const reqtoken = req.headers['authorization'];
    if (reqtoken !== undefined) {
        const data = reqtoken.split(' ');
        const token = data[1];
        const varify = jsonwebtoken_1.default.verify(token, 'mysupersecreatpassword', (err, decode) => {
            if (err) {
                res.status(401).json({
                    msg: 'Invalid token'
                });
            }
            else {
                next();
            }
        });
    }
}
app.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userdata = yield req.body;
    const validate = signInSchema.safeParse(userdata);
    console.log(validate.data);
    if (validate.success) {
        const user = yield prisma.user.findUnique({ where: { email: validate.data.email } });
        if (!user) {
            res.status(401).json({
                msg: 'Login Credintials are Incorrect'
            });
        }
        else {
            const passwordValidate = yield bcryptjs_1.default.compare(validate.data.password, user.password);
            if (passwordValidate) {
                res.status(401).json({
                    msg: 'Login Credintials are Incorrect'
                });
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, 'mysupersecreatpassword');
            res.status(200).json({ token });
        }
    }
}));
app.get('/dashboard', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma.order.findMany({
            include: {
                product: true,
                customer: true
            }
        });
        res.status(200).json({
            msg: 'Success',
            data: data
        });
    }
    catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
}));
app.listen(PORT, () => {
    console.log(`[ Ready ] http://localhost:${PORT}`);
});
