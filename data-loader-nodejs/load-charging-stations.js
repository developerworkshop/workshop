const csv = require("csv-parser");
const fs = require("fs");
const elasticsearch = require("elasticsearch");
const elasticUtils = require("./utils/elastic");

const indexName = "charging-stations";

const client = new elasticsearch.Client({
  host: "localhost:9200",
  log: "error",
  requestTimeout: Infinity
});

client.indices.create(
  {
    index: indexName,
    body: {
      mappings: {
        properties: {
          location: {
            type: "geo_point"
          }
        }
      }
    }
  },
  (err, resp) => {
    if (err) console.trace(err.message);
  }
);

const docs = [];
fs.createReadStream("data/bornes-irve-20190405.csv")
  .pipe(csv({ separator: ";" }))
  .on("data", data => {
    const document = {
      "@timestamp": new Date(),
      amenageur: data.n_amenageur,
      operateur: data.n_operateur,
      n_enseigne: data.n_enseigne,
      id_station: data.id_station,
      n_station: data.n_station,
      ad_station: data.ad_station,
      code_insee: data.code_insee,
      location: {
        lat: data.Ylatitude,
        lon: data.Xlongitude
      },
      nbre_pdc: data.nbre_pdc,
      id_pdc: data.id_pdc,
      puiss_max: data.puiss_max,
      type_prise: data.type_prise,
      acces_recharge: data.acces_recharge,
      accessibility: data["accessibilité"],
      observations: data.observations,
      date_maj: data.date_maj,
      source: data.source
    };
    docs.push(document);
  })
  .on("end", () => {
    console.log("done");
    elasticUtils.insertDataIntoES(client, indexName, docs);
  });
