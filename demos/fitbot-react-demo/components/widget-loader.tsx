"use client";

import { FitBotWidget } from "@fitbot/react";

const API_KEY = process.env.NEXT_PUBLIC_FITBOT_API_KEY || "";
const API_URL =
    process.env.NEXT_PUBLIC_FITBOT_API_URL || "https://gymbot-api.onrender.com/api";

export function WidgetLoader() {
    if (!API_KEY) return null;

    return (
        <FitBotWidget
            apiKey={API_KEY}
            apiUrl={API_URL}
            scriptUrl="/gymbot.min.js"
        />
    );
}
