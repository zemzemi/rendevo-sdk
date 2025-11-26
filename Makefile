.PHONY: install build dev clean test test-watch test-ui test-coverage publish

install:
	npm install

build:
	npm run build

dev:
	npm run dev

clean:
	rm -rf dist coverage

clean-all:
	rm -rf dist coverage node_modules

test:
	npm test

test-watch:
	npm run test:watch

test-ui:
	npm run test:ui

test-coverage:
	npm run test:coverage

publish: build
	npm publish --access public

lint:
	npm run lint

format:
	npm run format
