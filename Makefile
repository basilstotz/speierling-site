all:
	test -d data || mkdir -p data
	curl https://speierling.arglos.ch/data/sorbusdomestica.geojson 2>/dev/null > data/sorbusdomestica.geojson
	curl https://speierling.arglos.ch/data/archive-stats.js 2>/dev/null > data/archive-stats.js
