rm -Rf dist lib lib-esm
tsc
find src -name "*.svelte" |
  cut -d '/' -f 2- |
  xargs -I % sh -c 'mkdir -p lib/`dirname %` && cp src/% lib/%'
webpack --config webpack.config.babel.js --node-env production
