import https from "https";
import fs from "fs";

const token = process.env.EBIRD_API_TOKEN;

const options = {
  headers: {
    "X-eBirdApiToken": token,
  },
};

https
  .get(`https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json`, options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      if (res.statusCode === 200) {
        fs.writeFileSync("./src/assets/ebird_taxonomy.json", data);
        console.log(`✅ Fetched and saved taxonomy`);
      } else {
        console.error(`❌ Failed with status ${res.statusCode}: ${res.statusMessage}`);
        console.error(data);
      }
    });
  })
  .on("error", (err) => {
    console.error("❌ Error:", err.message);
  });
