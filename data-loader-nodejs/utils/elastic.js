function insertDataIntoES(esClient, indexName, values) {
  var chunks = [],
    size = 10000;

  const bulkfForIndex = items => createBulkInsertQuery(indexName)(items);

  while (values.length > 0) chunks.push(values.splice(0, size));

  chunks.forEach((chunks, idx) => {
    esClient.bulk(bulkfForIndex(chunks), (err, resp) => {
      if (err) console.trace(err.message);
      else {
        console.log(`Inserted ${resp.items.length} items`);
        if (idx === chunks.length - 1) {
          esClient.close();
        }
      }
    });
    setTimeout(() => {}, 1000);
  });
}

// Fonction utilitaire permettant de formatter les données pour l'insertion "bulk" dans elastic
function createBulkInsertQuery(indexName) {
  return values => {
    const body = values.reduce((acc, business) => {
      const { _id, ...rest } = business;
      acc.push({
        index: { _index: indexName, _type: "_doc", _id }
      });
      acc.push(rest);
      return acc;
    }, []);
    return { body };
  };
}

module.exports = {
  insertDataIntoES
};
