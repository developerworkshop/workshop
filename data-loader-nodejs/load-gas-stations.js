let XmlStream = require("xml-stream");
let fs = require("fs");
const elasticUtils = require("./utils/elastic");
const elasticsearch = require("elasticsearch");

const indexName = "gas-stations";

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

function translatePop(popValue) {
  if (popValue) {
    switch (popValue) {
      case "R":
        return "Route";
      case "A":
        return "Autoroute";
      default:
        break;
    }
  }
  return undefined;
}

const docs = [];
let stream = fs.createReadStream("data/PrixCarburants_instantane.xml");
let xml = new XmlStream(stream);
xml.collect("prix");
xml.collect("service");
xml.collect("jour");
xml.collect("horaire");
xml.on("endElement: pdv", function(item) {
  const pop = translatePop(item["$"].pop);
  const horaires =
    item.horaires && item.horaires.jour
      ? item.horaires.jour.map(elem => {
          const { id, nom, ferme } = elem["$"];
          const elemHoraires = elem.horaire || [];
          const range = elemHoraires.map(itemHor => {
            return Object.assign({}, itemHor["$"]);
          });
          return {
            jour: nom,
            id: id,
            close: ferme === "1",
            range: range
          };
        })
      : [];
  let longitude = item["$"].longitude;
  if (longitude.length === 5) {
    longitude = `0${longitude}`;
  } else if (longitude.length === 6 && longitude.startsWith("-")) {
    longitude = `-0${longitude.substring(1)}`;
  }
  const document = {
    "@timestamp": new Date(),
    adresse: item.adresse,
    ville: item.ville,
    cp: item.cp,
    location: {
      lat: parseFloat(item["$"].latitude) / 100000,
      lon: parseFloat(longitude) / 100000
    },
    services: item.services ? [...item.services.service] : [],
    prix: item.prix
      ? item.prix.map(elem => {
          return Object.assign({}, elem["$"]);
        })
      : [],
    automate2424: item.horaires
      ? item.horaires["$"]["automate-24-24"] === "1"
      : undefined,
    horaires: horaires,
    pop: pop
  };

  docs.push(document);
});

xml.on("error", function(err) {
  console.error(err); // si nous avons une erreur, nous pouvons la récupérer de cette façon et en faire ce que l'on souhaite.
});

xml.on("end", function() {
  console.log("end");
  elasticUtils.insertDataIntoES(client, indexName, docs);
});
