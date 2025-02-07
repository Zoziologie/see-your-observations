import fs from "fs";
import path from "path";
import csv from "csv-parser";

// Specify your input and output file paths
const inputFile = path.join("src", "assets", "eBird_taxonomy_v2024.csv");
const outputFile = path.join("src", "assets", "eBird_taxonomy.json");

const results = [];
const columnsToDrop = [
  "TAXON_ORDER",
  "SCI_NAME",
  "ORDER",
  "FAMILY",
  "SPECIES_GROUP",
  "TAXON_CONCEPT_ID",
]; // List the columns you want to drop

// Read and parse the CSV file
fs.createReadStream(inputFile)
  .pipe(csv())
  .on("data", (row) => {
    delete row[Object.keys(row)[0]];
    columnsToDrop.forEach((col) => delete row[col]);
    results.push(row);
  })
  .on("end", () => {
    // Write the results to a JSON file
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log("CSV to JSON conversion completed!");
  });
