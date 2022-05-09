#!/bin/sh

target=km_lambda.zip

zip -r "$target" . -x @.zipignore "$target"
