import fs from "fs";
import path from "path";
import csv from "csv-parser";

// Specify your input and output file paths
const inputFile = path.join("src", "assets", "eBird_taxonomy_v2024.csv");
const outputFile = path.join("src", "assets", "eBird_taxonomy.json");

const results = [];

// Read and parse the CSV file
fs.createReadStream(inputFile)
  .pipe(csv())
  .on("data", (row) => {
    results.push(row);
  })
  .on("end", () => {
    // Write the results to a JSON file
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log("CSV to JSON conversion completed!");
  });
