#!/bin/sh

target=km_lambda.zip

npm run build
zip -r "$target" . -x @.zipignore "$target"
