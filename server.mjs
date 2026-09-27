import express from "express";
import app from "./dist-server/index.js";

if (typeof express !== "function") {
  throw new Error("Express failed to load.");
}

export default app;
