# data-loaders-solution

Ce projet permet de charger des données dans une base Elastic.

Les données chargées sont issus d'open data fourni par https://www.data.gouv.fr, notamment : 
 * Le prix des carburants en France : https://donnees.roulez-eco.fr/opendata/instantane (cf https://www.prix-carburants.gouv.fr/rubrique/opendata/ pour les détails)
 * Les bornes de recharge pour véhicules électriques : https://www.data.gouv.fr/fr/datasets/fichier-consolide-des-bornes-de-recharge-pour-vehicules-electriques/#_

 Ce projet utilise la lib `xml-stream` pour gérer les fichiers XML et `csv-parser` pour traiter les fichiers CSV.
