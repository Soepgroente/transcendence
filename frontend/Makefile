#	Install dependencies: npm install --save-dev esbuild typescript
#	npm install babylonjs --save
#	npm install @babylonjs/core
#	npm install @babylonjs/havok

SRC		:=	src/game.ts

OUT_DIR	:=	dist
BUNDLE	:=	$(OUT_DIR)/bundle.js

.PHONY: all build clean

all: build

build: $(BUNDLE)

$(OUT_DIR):
	mkdir -p $(OUT_DIR)

$(BUNDLE): $(OUT_DIR) $(SRC)
	npx esbuild $(SRC) --bundle --outfile=$(BUNDLE) --platform=browser

clean:
	rm -rf $(OUT_DIR)

re: clean all

