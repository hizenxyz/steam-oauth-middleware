import express, { Request, Response } from "express";
import { SteamAuth } from "./steam-auth/steam-auth";

const app = express();
const steam = new SteamAuth({
    realm: "http://localhost:3000",
    returnUrl: "http://localhost:3000/auth/steam/authenticate",
    apiKey: "3048791120745874EE2F710E4E010699",
});

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

app.get("/auth/steam", async (req: Request, res: Response) => {
    const redirectUrl = await steam.getRedirectUrl();
    return res.redirect(redirectUrl);
});

app.get("/auth/steam/authenticate", async (req: Request, res: Response) => {
    try {
        const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
        const user = await steam.authenticate(fullUrl);

        res.json({
            message: "User authenticated",
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to authenticate user.");
    }
});

app.listen(3000, () => {
    console.log(`Example app listening on port 3000`);
});
