const express = require("express");
const router = express.Router();

const {
  saveResult,
  getResults,
} = require("../controllers/result.controller");

router.post("/", saveResult);
router.get("/", getResults);

module.exports = router;